import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-category-move-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <!-- Dynamic Cascading Dropdowns -->
      <ng-container *ngFor="let level of [0,1,2,3,4,5,6,7,8,9]; let i = index">
        <div *ngIf="shouldShowLevel(i)" class="animate-in fade-in">
          <label class="block text-sm text-gray-600  mb-2">
            {{ dropdownLabels[i] || 'Select Category' }}
          </label>
          <select
            [value]="selectedAtLevel[i] || ''"
            (change)="onSelectChange(i, $event)"
            class="w-full px-4 py-2 border border-gray-300  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 "
            [disabled]="loadingStates[i]">
            <option [value]="">
              {{ loadingStates[i] ? 'Loading...' : i === 0 ? 'No Parent' : 'Select category (optional)' }}
            </option>
            <option *ngFor="let cat of getDropdownOptions(i)" [value]="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </ng-container>

      <!-- Error Message -->
      <div *ngIf="error" class="p-3 bg-red-100  border border-red-400 dark:border-red-700 text-red-700  rounded-lg text-sm">
        {{ error }}
      </div>

      <!-- Buttons -->
      <div class="flex gap-3">
        <button
          type="submit"
          [disabled]="loading"
          class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700">
          {{ loading ? 'Moving...' : 'Move' }}
        </button>
        <button
          type="button"
          (click)="onCancel()"
          class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">
          Cancel
        </button>
      </div>
    </form>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryMoveFormComponent implements OnInit {
  @Input() category: Category | null = null;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() submit = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  treeCategories: Category[] = [];
  cascadingDropdowns: Category[][] = [];
  dropdownLabels: string[] = [];
  loadingStates: boolean[] = [];
  selectedAtLevel: (number | null)[] = [];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      selections: [[]]
    });
  }

  ngOnInit() {
    this.loadCategoryTree();
  }

  loadCategoryTree() {
    this.categoryService.getTreeCategories().subscribe({
      next: (tree: Category[]) => {
        
        this.treeCategories = tree;
        this.cascadingDropdowns[0] = tree;
        this.dropdownLabels[0] = 'Parent Category';
        this.loadingStates[0] = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('✗ Move form - Error loading category tree:', err);
        this.cdr.markForCheck();
      }
    });
  }

  onDropdownChange(level: number, categoryId: number | null) {
    this.selectedAtLevel[level] = categoryId;
    
    // Reset all deeper levels
    this.selectedAtLevel = this.selectedAtLevel.slice(0, level + 1);
    this.cascadingDropdowns = this.cascadingDropdowns.slice(0, level + 1);
    this.dropdownLabels = this.dropdownLabels.slice(0, level + 1);
    this.loadingStates = this.loadingStates.slice(0, level + 1);
    
    if (categoryId === null) {
      this.cdr.markForCheck();
      return;
    }
    
    const selectedCategory = this.findCategoryInTree(categoryId);
    
    if (selectedCategory && selectedCategory.children && selectedCategory.children.length > 0) {
      const nextLevel = level + 1;
      this.cascadingDropdowns[nextLevel] = selectedCategory.children;
      this.dropdownLabels[nextLevel] = `Level ${nextLevel + 1}`;
      this.loadingStates[nextLevel] = false;
    }
    
    this.cdr.markForCheck();
  }

  onSelectChange(level: number, event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const categoryId = value ? parseInt(value, 10) : null;
    this.onDropdownChange(level, categoryId);
  }

  findCategoryInTree(categoryId: number, categories?: Category[]): Category | null {
    const searchIn = categories || this.treeCategories;
    
    for (const cat of searchIn) {
      if (cat.id === categoryId) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = this.findCategoryInTree(categoryId, cat.children);
        if (found) return found;
      }
    }
    
    return null;
  }

  getDropdownOptions(level: number): Category[] {
    return this.cascadingDropdowns[level] || [];
  }

  shouldShowLevel(level: number): boolean {
    if (level === 0) {
      const hasData = this.cascadingDropdowns[0] && this.cascadingDropdowns[0].length > 0;
      return hasData;
    }
    
    const parentLevel = level - 1;
    const parentSelection = this.selectedAtLevel[parentLevel];
    
    if (parentSelection === null || parentSelection === undefined) {
      return false;
    }
    
    return this.cascadingDropdowns[level] && this.cascadingDropdowns[level].length > 0;
  }

  onSubmit() {
    const deepestSelected = this.selectedAtLevel.filter((v: number | null) => v !== null && v !== undefined).pop();
    const newParentId = deepestSelected || null;
    this.submit.emit(newParentId === null ? 0 : (newParentId as number));
  }

  onCancel() {
    this.cancel.emit();
  }
}
