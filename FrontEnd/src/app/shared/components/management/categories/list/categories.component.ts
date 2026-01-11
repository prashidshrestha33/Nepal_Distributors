import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';
import { CategoryMoveModalComponent } from '../move/category-move-modal.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CategoryMoveModalComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  items: Category[] = [];
  filteredItems: Category[] = [];
  rootCategories: Category[] = [];
  selectedRootCategory: number | null = null;
  searchTerm = '';
  loading = false;
  showMoveModal = false;
  selectedCategoryForMove: Category | null = null;
  moveFormLoading = false;
  moveError: string | null = null;

  // Pagination properties
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 30, 50, 100];
  currentPage: number = 1;
  paginatedItems: Category[] = [];

  // Export Math for template
  Math = Math;

  constructor(private service: CategoryService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getCategories().subscribe({
      next: (data: Category[]) => {
        console.log('✓ Categories loaded from API:', data);
        console.log('✓ Categories count:', data.length);
        
        // Flatten tree structure for table display
        this.items = this.flattenCategoryTree(data);
        console.log('✓ Flattened categories count:', this.items.length);
        
        // Extract root categories (depth = 1)
        this.rootCategories = this.items.filter(cat => cat.depth === 1);
        console.log('✓ Root categories (depth=1):', this.rootCategories);
        
        this.filteredItems = this.items;
        this.currentPage = 1;
        this.updatePaginatedItems();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('✗ Error loading categories:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Flatten tree structure to flat array for table display
   */
  flattenCategoryTree(categories: Category[], result: Category[] = []): Category[] {
    for (const cat of categories) {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        this.flattenCategoryTree(cat.children, result);
      }
    }
    return result;
  }

  onSearch() {
    this.currentPage = 1; // Reset to page 1 when searching
    this.applyFilters();
  }

  /**
   * Apply search filter and pagination
   */
  applyFilters() {
    let filtered = this.items;

    // Filter by search term
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        i.slug.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredItems = filtered;
    this.currentPage = 1; // Reset to page 1
    this.updatePaginatedItems();
  }

  /**
   * Update paginated items based on current page and page size
   */
  updatePaginatedItems() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.filteredItems.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  getTotalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  /**
   * Get array of page numbers for pagination display
   */
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const startPage = Math.max(0, this.currentPage - 3);
    const endPage = Math.min(totalPages, this.currentPage + 2);
    const pages: number[] = [];
    for (let i = startPage; i < endPage; i++) {
      pages.push(i + 1);
    }
    return pages;
  }

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePaginatedItems();
    }
  }

  /**
   * Change page size
   */
  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.updatePaginatedItems();
  }

  /**
   * Handle page size change event from select
   */
  handlePageSizeChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.onPageSizeChange(value);
  }

  delete(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this category?')) {
      this.service.deleteCategory(id).subscribe({
        next: () => this.load(),
        error: (err: any) => console.error('Error deleting category:', err)
      });
    }
  }

  openMoveModal(category: Category) {
    this.selectedCategoryForMove = category;
    this.showMoveModal = true;
    this.moveError = null;
  }

  closeMoveModal() {
    this.showMoveModal = false;
    this.selectedCategoryForMove = null;
    this.moveError = null;
  }

  onMoveSubmit(newParentId: number) {
    if (!this.selectedCategoryForMove?.id) return;
    
    this.moveFormLoading = true;
    this.service.moveCategory(this.selectedCategoryForMove.id, newParentId).subscribe({
      next: () => {
        this.closeMoveModal();
        this.load();
      },
      error: (err: any) => {
        console.error('Error moving category:', err);
        this.moveError = err?.error?.message || 'Failed to move category. Please try again.';
        this.moveFormLoading = false;
      }
    });
  }

  /**
   * Get parent category name by ID
   */
  getParentCategoryName(parentId: number | null): string {
    if (!parentId) return '-';
    const parent = this.items.find(cat => cat.id === parentId);
    return parent?.name || '-';
  }

  /**
   * Get parent category path (cascade) for a category
   * Returns array of parent categories from current to root
   */
  getParentCategoryPath(categoryId: number | null): Category[] {
    if (!categoryId) return [];
    
    const path: Category[] = [];
    let currentCat = this.items.find(cat => cat.id === categoryId);
    
    while (currentCat && currentCat.parent_id) {
      const parent = this.items.find(cat => cat.id === currentCat!.parent_id);
      if (parent) {
        path.unshift(parent); // Add to beginning to show root first
        currentCat = parent;
      } else {
        break;
      }
    }
    
    return path;
  }
}
