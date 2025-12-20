import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  format?: (value: any) => string;
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: (row: any) => void;
}

@Component({
  selector: 'app-admin-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th *ngFor="let col of columns" [style.width]="col.width" class="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              (click)="onSort.emit(col.key)" [class.opacity-50]="!col.sortable">
              {{ col.label }}
              <span *ngIf="col.sortable && sortColumn === col.key" class="ml-1">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th *ngIf="actions && actions.length > 0" class="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
            <td *ngFor="let col of columns" class="px-6 py-4">
              <span [ngSwitch]="col.key">
                <span *ngSwitchCase="'isApproved'">
                  <span *ngIf="row[col.key]" class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Approved</span>
                  <span *ngIf="!row[col.key]" class="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pending</span>
                </span>
                <span *ngSwitchCase="'isActive'">
                  <span *ngIf="row[col.key]" class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>
                  <span *ngIf="!row[col.key]" class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Inactive</span>
                </span>
                <span *ngSwitchDefault>
                  {{ col.format ? col.format(row[col.key]) : row[col.key] }}
                </span>
              </span>
            </td>
            <td *ngIf="actions && actions.length > 0" class="px-6 py-4 flex gap-2">
              <button *ngFor="let action of actions" (click)="action.action(row)"
                [class]="action.class || 'text-blue-600 hover:underline'"
                title="{{ action.label }}">
                {{ action.label }}
              </button>
            </td>
          </tr>
          <tr *ngIf="rows && rows.length === 0">
            <td [attr.colspan]="columns.length + (actions?.length ? 1 : 0)" class="px-6 py-4 text-center text-gray-400">
              No data found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class AdminTableComponent {
  @Input() columns: Column[] = [];
  @Input() rows: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() sortColumn: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Output() onSort = new EventEmitter<string>();
}
