import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLog } from '../../services/audit-log.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800">Audit Logs</h1>
        <button 
          (click)="refreshLogs()"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label class="text-sm font-medium text-gray-700">Module</label>
          <select [(ngModel)]="filterModule" (change)="onFilterChange()"
            class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Modules</option>
            <option value="users">Users</option>
            <option value="products">Products</option>
            <option value="categories">Categories</option>
            <option value="orders">Orders</option>
            <option value="quotations">Quotations</option>
            <option value="static-values">Static Values</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">Action</label>
          <select [(ngModel)]="filterAction" (change)="onFilterChange()"
            class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">From Date</label>
          <input type="date" [(ngModel)]="filterStartDate" (change)="onFilterChange()"
            class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">To Date</label>
          <input type="date" [(ngModel)]="filterEndDate" (change)="onFilterChange()"
            class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">Search</label>
          <input type="text" [(ngModel)]="searchTerm" (change)="onFilterChange()"
            placeholder="Search by user..."
            class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Logs Table -->
      <div *ngIf="!loading && logs.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-100 border-b">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Timestamp</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Module</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Entity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr *ngFor="let log of logs" class="hover:bg-gray-50">
              <td class="px-6 py-3 text-sm text-gray-900">
                {{ log.timestamp | date:'short' }}
              </td>
              <td class="px-6 py-3 text-sm text-gray-900">
                {{ log.username }}
              </td>
              <td class="px-6 py-3 text-sm">
                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {{ log.module }}
                </span>
              </td>
              <td class="px-6 py-3 text-sm">
                <span [ngClass]="getActionBadgeClass(log.action)"
                  class="inline-block px-2 py-1 rounded text-white font-medium text-xs">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-6 py-3 text-sm text-gray-900">
                {{ log.entityName }}
              </td>
              <td class="px-6 py-3 text-sm">
                <span *ngIf="log.status === 'success'" class="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  ✓ Success
                </span>
                <span *ngIf="log.status === 'failed'" class="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                  ✗ Failed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && logs.length === 0" class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-500 text-lg">No audit logs found</p>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1" class="flex justify-center items-center gap-2">
        <button 
          (click)="previousPage()"
          [disabled]="currentPage === 1"
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <span class="text-gray-700">Page {{ currentPage }} of {{ totalPages }}</span>
        <button 
          (click)="nextPage()"
          [disabled]="currentPage === totalPages"
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  logs: AuditLog[] = [];
  loading = false;
  errorMessage = '';
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  filterModule = '';
  filterAction = '';
  filterStartDate = '';
  filterEndDate = '';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.auditLogService.getLogs({
      page: this.currentPage,
      pageSize: this.pageSize,
      module: this.filterModule || undefined,
      action: this.filterAction || undefined,
      startDate: this.filterStartDate || undefined,
      endDate: this.filterEndDate || undefined,
      userId: this.searchTerm || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.logs = response.data;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Failed to load audit logs:', error);
          this.errorMessage = 'Failed to load audit logs';
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  refreshLogs(): void {
    this.loadLogs();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  getActionBadgeClass(action: string): string {
    const classes: Record<string, string> = {
      'CREATE': 'bg-green-600',
      'UPDATE': 'bg-blue-600',
      'DELETE': 'bg-red-600',
      'APPROVE': 'bg-purple-600',
      'REJECT': 'bg-orange-600'
    };
    return classes[action] || 'bg-gray-600';
  }
}
