import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  items: Category[] = [];
  filteredItems: Category[] = [];
  searchTerm = '';
  categoriesMap: Map<number, Category> = new Map();
  loading = false;

  constructor(private service: CategoryService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getCategories().subscribe({
      next: (data: Category[]) => {
        this.items = data;
        this.filteredItems = data;
        
        // Create map for easy lookup
        this.categoriesMap.clear();
        data.forEach(cat => {
          if (cat.id) {
            this.categoriesMap.set(cat.id, cat);
          }
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Get parent category name by parentId
   */
  getParentCategoryName(parentId?: number): string {
    if (!parentId || parentId === 0) {
      return 'Parent Category';
    }
    const parent = this.categoriesMap.get(parentId);
    return parent ? parent.name : 'Unknown';
  }

  /**
   * Check if category is a parent
   */
  isParentCategory(parentId?: number): boolean {
    return !parentId || parentId === 0;
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      i.slug.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  delete(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this category?')) {
      this.service.deleteCategory(id).subscribe({
        next: () => this.load(),
        error: (err) => console.error('Error deleting category:', err)
      });
    }
  }
}
