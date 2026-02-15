import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="w-full bg-white shadow-inner p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t mt-2 sticky bottom-0 z-10 justify-content: flex-end">
    <!-- Page size selector -->
    <div class="flex items-center gap-2">
      <span class="text-gray-600  text-sm">Show:</span>
      <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange($event)" class="border rounded px-2 py-1 text-sm">
        <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
      </select>
    </div>

    <!-- Page numbers -->
    <div class="flex items-center gap-2 flex-wrap justify-center">
      <button (click)="previousPage()" [disabled]="!hasPreviousPage()"
              class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
        Previous
      </button>
      <button *ngFor="let page of getVisiblePageNumbers()" (click)="goToPage(page)"
              [ngClass]="{
                'bg-blue-500 text-white': page === currentPage,
                'bg-white text-gray-700 ': page !== currentPage
              }"
              class="px-3 py-1 border rounded text-sm transition-colors">
        {{ page }}
      </button>
      <button (click)="nextPage()" [disabled]="!hasNextPage()"
              class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
        Next
      </button>
    </div>

    <!-- Page info -->
    <div class="text-sm text-gray-600 ">
      Page {{ currentPage }} of {{ totalPages }}
    </div>
  </div>
  `,
  styles: []
})
export class PaginationComponent {
  @Input() currentPage = 1;
  private _pageSize = 10;
  @Input() set pageSize(val: number | string) {
    this._pageSize = +val;
  }
  get pageSize(): number {
    return this._pageSize;
  }
  @Input() totalCount = 0;
  @Input() pageSizeOptions = [10, 20, 50, 100, 200];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(this.currentPage);
    }
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  getVisiblePageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 10;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  onPageSizeChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.pageSize = value;
    this.pageSizeChange.emit(this.pageSize);
    this.currentPage = 1;
  }
}
