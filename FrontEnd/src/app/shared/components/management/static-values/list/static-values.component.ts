import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValue } from '../../../../services/management/management.service';

@Component({
  selector: 'app-static-values',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './static-values.component.html',
  styleUrl: './static-values.component.css'
})
export class StaticValuesComponent implements OnInit {
  items: StaticValue[] = [];
  filteredItems: StaticValue[] = [];
  searchTerm = '';
  catalogId: number | null = null;
  catalogName: string = 'Static Values';
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private service: StaticValueService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Read catalogId from query parameters (supports ? catalogId=123)
    this.route.queryParams.subscribe(params => {
      const id = params['catalogId'];

      if (id) {
        this.catalogId = +id; // Convert to number
        this.loadCatalogTitle();
        this.load();
      } else {
        this.router.navigate(['/management/static-values-catalog']);
      }
    });
  }

  loadCatalogTitle(): void {
    if (this.catalogId) {
      this.service.getStaticValuesCatagory().subscribe(catalogs => {
        const cat = catalogs.find(c => c.catalogId === this.catalogId);
        if (cat) {
          this.catalogName = cat.catalogName;
        }
      });
    }
  }

  load(): void {
    if (!this.catalogId) {
      this.error = 'Invalid catalog ID';
      return;
    }
    this.loading = true;
    this.error = null;
    this.service.getStaticValues(this.catalogId).subscribe({
      next: (data: StaticValue[]) => {
        // Ensure data is properly structured
        this.items = data || [];
        this.filteredItems = [...this.items];
        this.applySort();
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.items = [];
        this.filteredItems = [];
        this.error = 'Failed to load static values. Please try again.';
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const search = this.searchTerm.toLowerCase().trim();
      this.filteredItems = this.items.filter(item =>
        item.staticData?.toLowerCase().includes(search) ||
        item.staticValueKey?.toLowerCase().includes(search)
      );
    }
    this.currentPage = 1;
    this.applySort();
    this.updatePagination();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.updatePagination();
  }

  applySort(): void {
    if (this.sortColumn) {
      this.filteredItems.sort((a, b) => {
        let valA: any = a[this.sortColumn as keyof StaticValue];
        let valB: any = b[this.sortColumn as keyof StaticValue];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredItems.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedItems(): StaticValue[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  delete(id: number): void {
    if (!id) {
      return;
    }

    if (confirm('Are you sure you want to delete this static value?')) {
      this.service.deleteStaticValue(id).subscribe({
        next: () => {
          this.load(); // Reload the list
        },
        error: (err) => {
          alert('Failed to delete static value:  ' + (err.message || 'Unknown error'));
        }
      });
    }
  }

  /**
   * Navigate back to catalog list
   */
  goBack(): void {
    this.router.navigate(['/management/static-values-catalog']); // Adjust path as needed
  }

  /**
   * Clear search and show all items
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredItems = [...this.items];
    this.currentPage = 1;
    this.updatePagination();
  }
}
