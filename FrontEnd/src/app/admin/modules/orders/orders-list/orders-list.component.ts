import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { OrdersService, Order } from '../../../services/orders.service';
import { AdminTableComponent, Column, TableAction } from '../../../shared/components/admin-table.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminTableComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800">Orders</h1>
        <a routerLink="/admin/orders/add" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ➕ Add Order
        </a>
      </div>

      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex gap-4 flex-wrap">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search orders..."
            class="px-4 py-2 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            (change)="onSearch()">
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
          [rows]="orders"
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
export class OrdersListComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = false;
  errorMessage = '';
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  searchTerm = '';

  columns: Column[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'orderNumber', label: 'Order #', sortable: true },
    { key: 'userId', label: 'User ID', sortable: false },
    { key: 'totalAmount', label: 'Total', sortable: true, format: (v) => `$${v.toFixed(2)}` },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'isApproved', label: 'Approval', sortable: true }
  ];

  tableActions: TableAction[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private ordersService: OrdersService, private router: Router) {
    this.setupTableActions();
  }

  ngOnInit() {
    this.loadOrders();
    this.setupSearchDebounce();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupTableActions() {
    this.tableActions = [
      { label: 'View', class: 'text-blue-600 hover:underline', action: (row: Order) => this.router.navigate(['/admin/orders', row.id]) },
      { label: 'Approve', class: 'text-green-600 hover:underline', action: (row: Order) => this.approveOrder(row) }
    ];
  }

  setupSearchDebounce() {
    this.searchSubject$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 1;
      this.loadOrders();
    });
  }

  loadOrders() {
    this.loading = true;
    this.errorMessage = '';
    this.ordersService.getOrders({ page: this.currentPage, pageSize: this.pageSize, search: this.searchTerm }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load orders';
        this.loading = false;
      }
    });
  }

  onSearch() { this.searchSubject$.next(this.searchTerm); }
  onPageSizeChange() { this.currentPage = 1; this.loadOrders(); }
  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadOrders(); } }
  previousPage() { if (this.currentPage > 1) { this.currentPage--; this.loadOrders(); } }

  approveOrder(order: Order) {
    if (confirm(`Approve order ${order.orderNumber}?`)) {
      this.ordersService.approveOrder(order.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.loadOrders(),
        error: (error) => console.error('Failed to approve order', error)
      });
    }
  }
}
