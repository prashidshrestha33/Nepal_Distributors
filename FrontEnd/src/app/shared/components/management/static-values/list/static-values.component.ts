import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValue } from '../../../../services/management/management.service';

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

  constructor(
    private service: StaticValueService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Read catalogId from query parameters (supports ? catalogId=123)
    this.route.queryParams.subscribe(params => {
      const id = params['catalogId'];
      
      if (id) {
        this.catalogId = +id; // Convert to number
        console.log('📋 Catalog ID received:', this.catalogId);
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
        debugger;
        this.items = data;
        this.filteredItems = data;
        this.loading = false;
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
      console.log('🗑️ Deleting static value:', id);
      
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