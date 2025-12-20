import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterConfig {
  name: string;
  type: 'text' | 'select' | 'date' | 'daterange' | 'checkbox' | 'number';
  label: string;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  value?: any;
}

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">
          <span class="text-blue-600">⊞</span> Advanced Filters
        </h3>
        <button 
          (click)="toggleFilters()"
          class="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          {{ showFilters ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div *ngIf="showFilters" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div *ngFor="let filter of filters" class="flex flex-col">
          <label class="text-sm font-medium text-gray-700 mb-2">
            {{ filter.label }}
          </label>

          <!-- Text Input -->
          <input 
            *ngIf="filter.type === 'text'"
            type="text"
            [placeholder]="filter.placeholder || 'Enter ' + filter.label"
            [(ngModel)]="filter.value"
            (change)="onFilterChange()"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <!-- Number Input -->
          <input 
            *ngIf="filter.type === 'number'"
            type="number"
            [placeholder]="filter.placeholder || 'Enter number'"
            [(ngModel)]="filter.value"
            (change)="onFilterChange()"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <!-- Date Input -->
          <input 
            *ngIf="filter.type === 'date'"
            type="date"
            [(ngModel)]="filter.value"
            (change)="onFilterChange()"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <!-- Date Range -->
          <div *ngIf="filter.type === 'daterange'" class="flex gap-2">
            <input 
              type="date"
              [(ngModel)]="filter.value?.from"
              (change)="onFilterChange()"
              placeholder="From"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <input 
              type="date"
              [(ngModel)]="filter.value?.to"
              (change)="onFilterChange()"
              placeholder="To"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
          </div>

          <!-- Select Dropdown -->
          <select 
            *ngIf="filter.type === 'select'"
            [(ngModel)]="filter.value"
            (change)="onFilterChange()"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {{ filter.label }}</option>
            <option *ngFor="let option of filter.options" [value]="option.value">
              {{ option.label }}
            </option>
          </select>

          <!-- Checkbox -->
          <label *ngIf="filter.type === 'checkbox'" class="flex items-center">
            <input 
              type="checkbox"
              [(ngModel)]="filter.value"
              (change)="onFilterChange()"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700">{{ filter.label }}</span>
          </label>
        </div>
      </div>

      <div *ngIf="showFilters" class="flex gap-2 mt-4">
        <button 
          (click)="applyFilters()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Apply Filters
        </button>
        <button 
          (click)="resetFilters()"
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-medium"
        >
          Reset
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AdvancedFiltersComponent {
  @Input() filters: FilterConfig[] = [];
  @Output() filtersApplied = new EventEmitter<FilterConfig[]>();
  @Output() filtersReset = new EventEmitter<void>();

  showFilters = false;
  private originalFilters: FilterConfig[] = [];

  ngOnInit() {
    // Store original filter values for reset
    this.originalFilters = JSON.parse(JSON.stringify(this.filters));
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onFilterChange(): void {
    // Called when any filter changes
  }

  applyFilters(): void {
    const activeFilters = this.filters.filter(f => f.value !== null && f.value !== undefined && f.value !== '');
    this.filtersApplied.emit(activeFilters);
  }

  resetFilters(): void {
    this.filters.forEach((filter, index) => {
      filter.value = this.originalFilters[index].value;
    });
    this.filtersReset.emit();
  }
}
