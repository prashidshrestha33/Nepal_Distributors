import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValue } from '../../../../services/management/management.service';
import { BreadcrumbService } from '../../../../services/breadcrumb.service';

@Component({
  selector:  'app-static-values',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './static-values.component.html',
  styleUrl: './static-values.component.css'
})
export class StaticValuesComponent implements OnInit {
  items:  StaticValue[] = [];
  filteredItems: StaticValue[] = [];
  searchTerm = '';
  catalogId: number | null = null;
  loading = false;
  error: string | null = null;
  catalogTitle = 'Static Values';
  keyTitle = 'Key';
  dataTitle = 'Value';

  constructor(
    private service: StaticValueService,
    private route: ActivatedRoute,
    private router: Router,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    // Read catalogId from query parameters (supports ? catalogId=123)
    this.route.queryParams.subscribe(params => {
      const id = params['catalogId'];
      
      if (id) {
        this.catalogId = +id; // Convert to number
        this.load();
      } else {
     this.router.navigate(['/management/static-values-catalog']);
      }
    });
  }

  load(): void {
    if (! this.catalogId) {
      this.error = 'Invalid catalog ID';
      return;
    }
    this.loading = true;
    this.error = null;
    this.service.getStaticValues(this.catalogId).subscribe({
      next: (data:  StaticValue[]) => {
        this.items = data;
        this.filteredItems = data;
        this.loading = false;
        
        // Also fetch the catalog to get the titles
        this.service.getStaticValuesCatagory().subscribe(catalogs => {
          const currentCatalog = catalogs.find(c => c.catalogId === this.catalogId);
          if (currentCatalog) {
            this.catalogTitle = currentCatalog.catalogTitle || currentCatalog.catalogName || 'Static Values';
            this.keyTitle = currentCatalog.keyTitle || 'Key';
            this.dataTitle = currentCatalog.dataTitle || 'Value';
            
            // Update breadcrumb
            this.breadcrumbService.updateLastBreadcrumbLabel(this.catalogTitle);
          }
        });
      },
      error:  (err) => {
        this.loading = false;
        this.items = [];
        this.filteredItems = [];
      }
    });
  }
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [...this.items];
      return;
    }

    const search = this.searchTerm.toLowerCase().trim();
    this.filteredItems = this.items.filter(item =>
      item.staticData?. toLowerCase().includes(search) ||
      item.staticValueKey?.toLowerCase().includes(search) 
    );
  }
  delete(id: number): void {
    if (! id) {
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
    this.router.navigate(['/admin/static-value-catalogs']); // Adjust path as needed
  }

  /**
   * Clear search and show all items
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredItems = [...this. items];
  }
}