import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationsService, Notification } from '../../../services/notifications.service';
import { AdminTableComponent, Column, TableAction } from '../../../shared/components/admin-table.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminTableComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800">Notifications</h1>
        <button (click)="markAllAsRead()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          ✓ Mark All as Read
        </button>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex gap-4 flex-wrap">
          <select [(ngModel)]="filterType" (change)="onFilterChange()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            <option value="order">Orders</option>
            <option value="quotation">Quotations</option>
          </select>
          <select [(ngModel)]="pageSize" (change)="onPageSizeChange()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="!loading" class="bg-white rounded-lg shadow">
        <app-admin-table
          [columns]="columns"
          [rows]="notifications"
          [actions]="tableActions">
        </app-admin-table>
      </div>

      <div *ngIf="!loading && totalPages > 1" class="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div class="text-gray-600">Page {{ currentPage }} of {{ totalPages }}</div>
        <div class="flex gap-2">
          <button (click)="previousPage()" [disabled]="currentPage === 1" class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50">Previous</button>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50">Next</button>
        </div>
      </div>

      <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">{{ errorMessage }}</div>
    </div>
  `
})
export class NotificationsListComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = false;
  errorMessage = '';
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  filterType = '';

  columns: Column[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'message', label: 'Message', sortable: false },
    { key: 'isRead', label: 'Status', sortable: true }
  ];

  tableActions: TableAction[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationsService: NotificationsService) {
    this.setupTableActions();
  }

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupTableActions() {
    this.tableActions = [
      { label: 'Mark as Read', class: 'text-blue-600 hover:underline', action: (row: Notification) => this.markAsRead(row) },
      { label: 'Delete', class: 'text-red-600 hover:underline', action: (row: Notification) => this.deleteNotification(row) }
    ];
  }

  loadNotifications() {
    this.loading = true;
    this.errorMessage = '';
    this.notificationsService.getNotifications({ page: this.currentPage, pageSize: this.pageSize }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.notifications = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load notifications';
        this.loading = false;
      }
    });
  }

  onFilterChange() { this.currentPage = 1; this.loadNotifications(); }
  onPageSizeChange() { this.currentPage = 1; this.loadNotifications(); }
  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadNotifications(); } }
  previousPage() { if (this.currentPage > 1) { this.currentPage--; this.loadNotifications(); } }

  markAsRead(notification: Notification) {
    this.notificationsService.markAsRead(notification.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadNotifications(),
      error: (error) => console.error('Failed to mark as read', error)
    });
  }

  markAllAsRead() {
    if (confirm('Mark all notifications as read?')) {
      this.notificationsService.markAllAsRead().pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.loadNotifications(),
        error: (error) => console.error('Failed to mark all as read', error)
      });
    }
  }

  deleteNotification(notification: Notification) {
    if (confirm('Delete this notification?')) {
      this.notificationsService.deleteNotification(notification.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.loadNotifications(),
        error: (error) => console.error('Failed to delete notification', error)
      });
    }
  }
}
