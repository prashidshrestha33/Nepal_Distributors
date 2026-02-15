import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-category-cascade',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-300  rounded-lg shadow-lg p-3 min-w-max">
      <div class="space-y-1 max-h-96 overflow-y-auto">
        <div *ngIf="categories.length === 0" class="text-xs text-gray-500 ">No child categories</div>
        
        <!-- Category Item with Cascade -->
        <div *ngFor="let cat of categories" class="relative group">
          <div class="text-xs text-gray-700  p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-default flex items-center justify-between">
            <span>{{ cat.name }}</span>
            <span *ngIf="hasChildren(cat.id)" class="text-gray-400 ml-2">→</span>
          </div>
          
          <!-- Nested Cascade for children -->
          <div *ngIf="hasChildren(cat.id)"
               class="absolute left-full ml-1 top-0 group-hover:block hidden z-50">
            <app-category-cascade 
              [categories]="getChildrenOfCategory(cat.id)"
              [allCategories]="allCategories">
            </app-category-cascade>
          </div>
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
export class CategoryCascadeComponent {
  @Input() categories: Category[] = [];
  @Input() allCategories: Category[] = [];

  /**
   * Check if a category has children
   */
  hasChildren(categoryId: number): boolean {
    return this.allCategories.some(cat => cat.parent_id === categoryId);
  }

  /**
   * Get children of a category
   */
  getChildrenOfCategory(categoryId: number): Category[] {
    return this.allCategories.filter(cat => cat.parent_id === categoryId);
  }
}
