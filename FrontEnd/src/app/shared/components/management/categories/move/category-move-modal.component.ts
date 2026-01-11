import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryMoveFormComponent } from './category-move-form.component';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-category-move-modal',
  standalone: true,
  imports: [CommonModule, CategoryMoveFormComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in duration-300">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Move Category</h2>
          <button 
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">
            ✕
          </button>
        </div>

        <!-- Category Info -->
        <div *ngIf="category" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Moving:</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ category.name }}</p>
        </div>

        <!-- Move Form -->
        <app-category-move-form 
          [category]="category"
          [loading]="loading"
          [error]="error"
          (submit)="onSubmit($event)"
          (cancel)="onClose()">
        </app-category-move-form>
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

  ngOnInit() {
  }

  onSubmit(newParentId: number) {
    this.submit.emit(newParentId);
  }

  onClose() {
    this.close.emit();
  }
}
