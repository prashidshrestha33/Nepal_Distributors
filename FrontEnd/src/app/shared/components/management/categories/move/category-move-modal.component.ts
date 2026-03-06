import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Category } from '../../../../services/management/management.service';
import { CatagoryDynamicComponent } from '../../../CustomComponents/CatagoryDynamic/catagory-dynamic.component';

@Component({
  selector: 'app-category-move-modal',
  standalone: true,
  imports: [CommonModule, CatagoryDynamicComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in duration-300">

        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Move Category</h2>
          <button 
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">
            ✕
          </button>
        </div>

        <!-- Category Info -->
        <div *ngIf="category" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p class="text-sm text-gray-600 mb-1">Moving:</p>
          <p class="text-lg font-semibold text-gray-900">{{ category.name }}</p>
        </div>

        <!-- Category Selection -->
        <app-category-dynamic (categorySelected)="onCategoryChosen($event)"></app-category-dynamic>

        <!-- Buttons -->
        <div class="flex gap-3 mt-6">
          <!-- Move Button -->
          <button
            type="button"
            [disabled]="loading || !selectedCategoryId"
            (click)="onSubmit(selectedCategoryId!)"
            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700">
            {{ loading ? 'Moving...' : 'Move' }}
          </button>

          <!-- Cancel Button -->
          <button
            type="button"
            (click)="onClose()"
            class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">
            Cancel
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class CategoryMoveModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() category: Category | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() submit = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  selectedCategoryId?: number;

  ngOnInit() {}

  /** Emit selected category ID to parent */
  onSubmit(newParentId: number) {
    this.submit.emit(newParentId);
    if(newParentId)
    {
      alert("This is moved");
      
    }
    
    this.close.emit();
  }

  /** Close modal */
  onClose() {
    this.close.emit();
  }

  /** Save selected category ID */
  onCategoryChosen(categoryId: number) {
    this.selectedCategoryId = categoryId;
  }
}