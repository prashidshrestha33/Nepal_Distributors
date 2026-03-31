import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';
import { CategoryMoveModalComponent } from '../move/category-move-modal.component';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CategoryMoveModalComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  itemsTree: Category[] = [];
  expandedCategoryIds = new Set<number>();
  searchTerm = '';
  loading = false;
  showMoveModal = false;
  selectedCategoryForMove: Category | null = null;
  moveFormLoading = false;
  moveError: string | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  snackbar: { show: boolean; message: string; type: 'success' | 'error' | 'warning' } = { show: false, message: '', type: 'success' };

  // Pagination properties
  pageSize: number = 10;
  pageSizeOptions: number[] = [10, 20, 30, 50, 100];
  currentPage: number = 1;
  paginatedItems: any[] = [];

  // Export Math for template
  Math = Math;

  constructor(private service: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();

    // Check for snackbar from navigation state
    const nav = this.router.getCurrentNavigation();
    const stateSnackbar = nav?.extras?.state?.['snackbar'] || 
                         (window.history.state?.['snackbar']);

    if (stateSnackbar) {
      this.showSnackbar(stateSnackbar.message, stateSnackbar.success ? 'success' : 'error');
    }
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 5000) {
    this.snackbar = { show: true, message, type };
    setTimeout(() => {
      this.snackbar.show = false;
      this.cdr.detectChanges();
    }, duration);
    this.cdr.detectChanges();
  }

  load() {
  this.loading = true;
  this.service.getAllCategories().subscribe({
    next: (data: Category[]) => {
      this.itemsTree = data;
      this.items = this.flattenVisibleCategoryTree(this.itemsTree);

      this.filteredItems = this.items;
      this.currentPage = 1;
      this.updatePaginatedItems();
      this.loading = false;
    },
    error: (err: any) => {
      this.loading = false;
      console.error('Failed to load categories', err);
    }
  });
}

  toggleExpand(categoryId: number, event: Event) {
    event.stopPropagation();
    if (this.expandedCategoryIds.has(categoryId)) {
      this.expandedCategoryIds.delete(categoryId);
    } else {
      this.expandedCategoryIds.add(categoryId);
    }
    this.items = this.flattenVisibleCategoryTree(this.itemsTree);
    this.applyFilters();
  }

  /**
   * Flatten visible tree structure for table display based on expanded state
   */
  flattenVisibleCategoryTree(categories: Category[], depth: number = 0): any[] {
    let result: any[] = [];
    
    // Sort at current level if name sorting is active
    let sortedCats = [...categories];
    if (this.sortColumn === 'name') {
      sortedCats.sort((a, b) => {
        const valA = a.name?.toLowerCase() || '';
        const valB = b.name?.toLowerCase() || '';
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    for (const cat of sortedCats) {
      const hasChildren = !!(cat.children && cat.children.length > 0);
      const isExpanded = this.expandedCategoryIds.has(cat.id);
      
      const flatCat = { ...cat, depth, isExpanded, hasChildren };
      result.push(flatCat);

      if (isExpanded && hasChildren) {
        result.push(...this.flattenVisibleCategoryTree(cat.children!, depth + 1));
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
        (i.slug).toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredItems = filtered;
    this.currentPage = 1; // Reset to page 1
    this.updatePaginatedItems();
  }
  getImageUrl(imageName?: string): string {
    return imageName 
      ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
      : 'assets/images/no-image.png';
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
        next: () => {
          this.load();
          this.showSnackbar('Category deleted successfully!', 'success');
        },
        error: (err: any) => {
          console.error('Error deleting category:', err);
          this.showSnackbar('Failed to delete category.', 'error');
        }
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
    
    const sourceName = this.selectedCategoryForMove.name;
    const destName = newParentId === 0 ? 'Root' : this.getCategoryNameFromTree(this.itemsTree, newParentId) || 'New Parent';

    this.moveFormLoading = true;
    this.service.moveCategory(this.selectedCategoryForMove.id, newParentId).subscribe({
      next: () => {
        this.closeMoveModal();
        this.load();
        this.showSnackbar(`Moved successfully ${sourceName} to ${destName}`, 'success');
      },
      error: (err: any) => {
        console.error('Error moving category:', err);
        this.moveError = err?.error?.message || 'Failed to move category. Please try again.';
        this.moveFormLoading = false;
        this.showSnackbar('Failed to move category.', 'error');
      }
    });
  }

  /** Helpful method to find category name in tree */
  private getCategoryNameFromTree(categories: Category[], id: number): string | null {
    for (const cat of categories) {
      if (cat.id === id) return cat.name;
      if (cat.children?.length) {
        const found = this.getCategoryNameFromTree(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Re-flatten to apply sort
    this.items = this.flattenVisibleCategoryTree(this.itemsTree);
    this.applyFilters();
  }

  goToEdit(id: number) {
    this.router.navigate(['/management/categories/edit', id]);
  }
}
