import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValueCatalog } from '../../../../services/management/management.service';

@Component({
  selector: 'app-static-values',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './static-values-catalog.component.html',
  styleUrl: './static-values-catalog.component.css'
})
export class StaticValuesCatalogComponent implements OnInit {
  items: StaticValueCatalog[] = [];
  filteredItems: StaticValueCatalog[] = [];
  searchTerm = '';
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private service: StaticValueService, private router: Router) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.service.getStaticValuesCatagory().subscribe({
      next: (data: StaticValueCatalog[]) => {
        this.items = data || [];
        this.filteredItems = [...this.items];
        this.applySort();
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load static value catalogs:', err);
        this.error = 'Failed to load static value catalogs. Please try again.';
        this.loading = false;
        this.items = [];
        this.filteredItems = [];
      }
    });
  }

  viewStaticValues(catalogId: number): void {
    this.router.navigate(['/management/static-values'], {
      queryParams: { catalogId: catalogId }
    });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredItems = this.items.filter(i =>
        i.catalogName?.toLowerCase().includes(term) ||
        i.catalogType?.toLowerCase().includes(term) ||
        i.catalogDescription?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.applySort();
    this.updatePagination();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.updatePagination();
  }

  applySort() {
    if (this.sortColumn) {
      this.filteredItems.sort((a, b) => {
        let valA: any = a[this.sortColumn as keyof StaticValueCatalog];
        let valB: any = b[this.sortColumn as keyof StaticValueCatalog];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredItems.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedItems(): StaticValueCatalog[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this catalog?')) {
      this.service.deleteStaticValue(id).subscribe(() => this.load());
    }
  }
}
