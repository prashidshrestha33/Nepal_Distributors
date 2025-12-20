import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  items: Category[] = [];
  filteredItems: Category[] = [];
  searchTerm = '';

  constructor(private service: CategoryService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getCategories().subscribe((data: Category[]) => {
      this.items = data;
      this.filteredItems = data;
    });
  }

  onSearch() {
    this.filteredItems = this.items.filter(i =>
      i.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  approve(id: number) {
    this.service.approveCategory(id).subscribe(() => this.load());
  }

  delete(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteCategory(id).subscribe(() => this.load());
    }
  }
}
