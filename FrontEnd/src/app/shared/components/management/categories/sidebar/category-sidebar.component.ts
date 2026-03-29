import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../../services/management/management.service';

export interface SidebarBrand {
  id: number;
  name: string;
  productCount: number;
}

@Component({
  selector: 'app-category-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-sidebar.component.html',
  styleUrls: ['./category-sidebar.component.css']
})
export class CategorySidebarComponent {
  @Input() categories: Category[] = [];
  @Input() selectedCategoryId: number | null = null;
  @Input() topBrands: SidebarBrand[] = [];
  @Input() topManufacturers: SidebarBrand[] = []; // Same structure as SidebarBrand
  @Output() categorySelected = new EventEmitter<number | null>();
  @Output() brandSelected = new EventEmitter<number>();
  @Output() manufacturerSelected = new EventEmitter<number>();

  // Use a Set to track expanded parent categories
  expandedCategories: Set<number> = new Set<number>();

  onSelectCategory(id: number | null) {
    this.categorySelected.emit(id);
  }

  toggleCollapse(category: Category, event: Event) {
    event.stopPropagation(); // Prevent triggering selection
    if (this.expandedCategories.has(category.id)) {
      this.expandedCategories.delete(category.id);
    } else {
      this.expandedCategories.add(category.id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedCategories.has(id);
  }
}
