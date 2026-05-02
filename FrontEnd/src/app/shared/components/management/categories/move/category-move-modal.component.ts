import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Category } from '../../../../services/management/management.service';
import { CatagoryDynamicComponent } from '../../../CustomComponents/CatagoryDynamic/catagory-dynamic.component';

@Component({
  selector: 'app-category-move-modal',
  standalone: true,
  imports: [CommonModule, CatagoryDynamicComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md flex items-center justify-center z-[999] p-4 sm:p-6 animate-fade-in">
      <div class="bg-white max-w-2xl w-full rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col border border-white/20 animate-scale-up">
        
        <!-- Premium Decorative Background -->
        <div class="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-24 -mt-24 opacity-60"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -ml-24 -mb-24 opacity-60"></div>

        <!-- Header Section -->
        <div class="px-8 sm:px-12 pt-10 pb-6 flex items-center justify-between relative z-10">
          <div>
            <h2 class="font-black text-3xl text-[#0f172a] tracking-tight mb-1">Move Category</h2>
            
          </div>
          <button (click)="onClose()" 
            class="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-300 transform hover:rotate-90">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content Body -->
        <div class="px-8 sm:px-12 pb-10 space-y-6 relative z-10 overflow-y-auto max-h-[65vh]">
          
          <!-- Category Identity Card -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
            <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">📦 Moving Category</p>

            <!-- Breadcrumb Path -->
            <div class="flex items-center flex-wrap gap-1.5 mb-4">
              <ng-container *ngFor="let ancestor of ancestorPath; let last = last">
                <span class="text-xs font-bold" [class.text-gray-400]="!last" [class.text-blue-700]="last">{{ ancestor.name }}</span>
                <span *ngIf="!last" class="text-gray-300 text-xs font-bold">›</span>
              </ng-container>
              <span *ngIf="ancestorPath.length === 0" class="text-sm font-black text-blue-700">{{ category?.name }}</span>
            </div>

            <!-- Name & Badges -->
            <div class="flex items-center gap-3 flex-wrap">
              <h3 class="text-2xl font-black text-[#0f172a]">{{ category?.name }}</h3>
              <!-- Depth Badge -->
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                [ngClass]="{
                  'bg-purple-100 text-purple-700': (category?.depth || 0) === 0,
                  'bg-blue-100 text-blue-700': (category?.depth || 0) === 1,
                  'bg-teal-100 text-teal-700': (category?.depth || 0) === 2
                }">
                {{ (category?.depth || 0) === 0 ? '🌳 Main Category' : (category?.depth || 0) === 1 ? '📁 Sub Category' : '📄 Sub-Sub Category' }}
              </span>
              <!-- Child Count Badge -->
              <span *ngIf="childCount > 0" class="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                {{ childCount }} child{{ childCount > 1 ? 'ren' : '' }}
              </span>
            </div>
          </div>

          <!-- Preview of what will happen -->
          <div *ngIf="selectedCategoryId !== undefined" class="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex gap-4 items-start">
            <div class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-black text-emerald-800 mb-1">After this move:</p>
              <p class="text-xs font-semibold text-emerald-700 leading-relaxed">
                <span *ngIf="selectedCategoryId === 0">
                  <strong>{{ category?.name }}</strong> will become a <strong>Main Category</strong>
                  <span *ngIf="childCount > 0">Its {{ childCount }} child categor{{ childCount > 1 ? 'ies' : 'y' }} will shift up one level.</span>
                </span>
                <span *ngIf="selectedCategoryId !== 0">
                  <strong>{{ category?.name }}</strong> will be moved under the selected category. 
                  <span *ngIf="childCount > 0">All {{ childCount }} child categor{{ childCount > 1 ? 'ies' : 'y' }} will also move with it.</span>
                </span>
              </p>
            </div>
          </div>

          <!-- Root Toggle Action -->
          <div class="relative group">
            <button 
              (click)="setToRoot()"
              [class.bg-emerald-50]="selectedCategoryId === 0"
              [class.border-emerald-300]="selectedCategoryId === 0"
              [class.border-gray-100]="selectedCategoryId !== 0"
              class="w-full flex items-center justify-between p-5 rounded-[2rem] border-2 border-dashed hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 group">
              <div class="flex items-center gap-4 text-left">
                <div class="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                   <span class="text-2xl">🌳</span>
                </div>
                <div>
                   <h4 class="font-black text-[#0f172a] tracking-tight">Make Main Category</h4>
                   <p class="text-xs font-bold text-gray-400">Remove parent</p>
                </div>
              </div>
              <div *ngIf="selectedCategoryId === 0" class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          </div>

          <!-- Divider -->
          <div class="flex items-center gap-4">
            <div class="h-px bg-gray-100 flex-grow"></div>
            <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR SELECT NEW PARENT</span>
            <div class="h-px bg-gray-100 flex-grow"></div>
          </div>

          <!-- Selector -->
          <div class="space-y-4">
            <app-category-dynamic 
              [initialCategoryId]="category?.parentId || 0"
              [excludeCategoryIds]="excludedIds"
              (categorySelected)="onCategoryChosen($event)">
            </app-category-dynamic>
          </div>

        </div>

        <!-- Action Footer -->
        <div class="px-8 sm:px-12 py-8 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
          <button (click)="onClose()" class="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-gray-800 transition group order-2 sm:order-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancel Action
          </button>

          <button 
            (click)="onSubmit(selectedCategoryId!)" 
            [disabled]="loading || !isMoveValid"
            class="flex-1 sm:flex-none px-12 py-4 bg-blue-600 text-white font-black text-sm rounded-3xl hover:bg-blue-700 transition-all duration-300 shadow-xl shadow-blue-100 hover:shadow-2xl disabled:opacity-30 disabled:shadow-none active:scale-95">
            {{ loading ? 'Moving...' : 'Confirm Move' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class CategoryMoveModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() category: Category | null = null;
  @Input() allCategories: Category[] = [];  // Full flat list for path building
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() submit = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  selectedCategoryId?: number;
  excludedIds: number[] = [];
  ancestorPath: Category[] = [];

  ngOnInit() {
    this.computeState();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category'] || changes['allCategories']) {
      this.computeState();
      this.selectedCategoryId = undefined; // reset selection when category changes
    }
  }

  private computeState() {
    if (this.category) {
      this.excludedIds = this.getDescendantIds(this.category);
      this.excludedIds.push(this.category.id);
      this.ancestorPath = this.buildAncestorPath(this.category);
    }
  }

  /** Build the full path: [Learning, Book, .NET Technology] */
  private buildAncestorPath(cat: Category): Category[] {
    const path: Category[] = [];
    let current: Category | undefined = cat;
    const flatAll = this.flattenTree(this.allCategories);

    // Walk up using parentId
    const visited = new Set<number>();
    while (current) {
      path.unshift(current);
      if (visited.has(current.id)) break;
      visited.add(current.id);
      if (!current.parentId) break;
      current = flatAll.find(c => c.id === current!.parentId);
    }
    return path;
  }

  private flattenTree(cats: Category[]): Category[] {
    const result: Category[] = [];
    const recurse = (list: Category[]) => {
      list.forEach(c => {
        result.push(c);
        if (c.children?.length) recurse(c.children);
      });
    };
    recurse(cats);
    return result;
  }

  /** Count of direct children */
  get childCount(): number {
    return this.category?.children?.length || 0;
  }

  /** Recursively get all child IDs to prevent circular moves */
  private getDescendantIds(cat: Category): number[] {
    let ids: number[] = [];
    if (cat.children) {
      cat.children.forEach(child => {
        ids.push(child.id);
        ids.push(...this.getDescendantIds(child));
      });
    }
    return ids;
  }

  /** Explicitly set target to Root (0) */
  setToRoot() {
    this.selectedCategoryId = 0;
  }

  /** Enable button only if new parent is different from current parent */
  get isMoveValid(): boolean {
    if (this.selectedCategoryId === undefined) return false;

    // Normalize current parent ID (treat undefined/null as 0)
    const currentParentId = this.category?.parentId || 0;

    // Disable if moving to the same parent
    if (this.selectedCategoryId === currentParentId) return false;

    // Disable if moving into its own descendant branch
    if (this.excludedIds.includes(this.selectedCategoryId)) return false;

    return true;
  }

  /** Emit selected category ID to parent */
  onSubmit(newParentId: number) {
    if (this.isMoveValid) {
      this.submit.emit(newParentId);
      // Close modal is handled by parent or by emitting close
    }
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