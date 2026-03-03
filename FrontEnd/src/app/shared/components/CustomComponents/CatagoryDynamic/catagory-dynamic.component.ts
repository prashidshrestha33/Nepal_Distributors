import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select'; // <-- IMPORT NgSelectModule
import { CompanyService } from '../../../services/management/company.service';

@Component({
  selector: 'app-category-dynamic',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule], // <-- add NgSelectModule here
  templateUrl: './catagory-dynamic.component.html',
  styleUrls: ['./catagory-dynamic.component.css']
})
export class CatagoryDynamicComponent implements OnInit {

  // Inputs
  @Input() companyId!: number;

  // Output
  @Output() categorySelected = new EventEmitter<number>();

  // State
  loading = false;
  error: string | null = null;

  categoryLevels: { parentId: number; categories: any[] }[] = [];
  selectedPath: (number | null)[] = [];

  constructor(private companyService: CompanyService) {}

  ngOnInit(): void {this.loadRootCategories();
  }

  loadRootCategories() {
    this.loading = true;
    this.companyService.getCategoriesparent(0).subscribe({
      next: (res: any) => {
        const categories = Array.isArray(res) ? res : res?.data || [];
        this.categoryLevels = [{ parentId: 0, categories }];
        this.selectedPath = [null];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load categories';
        this.loading = false;
      }
    });
  }
onCategorySelect(levelIndex: number, selectedId: number | null) {

  // Remove deeper levels if parent changes
  this.categoryLevels = this.categoryLevels.slice(0, levelIndex + 1);
  this.selectedPath = this.selectedPath.slice(0, levelIndex + 1);
  this.selectedPath[levelIndex] = selectedId ?? null;
  let finalSelected: number | null = null;
  for (let i = this.selectedPath.length - 1; i >= 0; i--) {
    if (this.selectedPath[i] != null) {
      finalSelected = this.selectedPath[i];
      break;
    }
  }
  if (finalSelected != null) {
    this.categorySelected.emit(finalSelected);
  }

  if (!selectedId) return;
  this.companyService.getCategoriesparent(selectedId).subscribe({
    next: (res: any) => {
      const children = Array.isArray(res) ? res : res?.data || [];
      if (children.length > 0) {
        this.categoryLevels.push({ parentId: selectedId, categories: children });
        this.selectedPath.push(null); // placeholder for next level
      }
    },
    error: () => console.error('Failed to load child categories')
  });

}
  getCategoryNameById(id: number | null): string {
    if (id == null) return '';
    for (let level of this.categoryLevels) {
      const found = level.categories.find(cat => cat.id === id);
      if (found) return found.name;
    }
    return '';
  }

}