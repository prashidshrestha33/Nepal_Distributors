import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UsersService, User } from '../../../services/users.service';
import { AdminTableComponent, Column, TableAction } from '../../../shared/components/admin-table.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminTableComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800">Users</h1>
        <a routerLink="/admin/users/add" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ➕ Add User
        </a>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex gap-4 flex-wrap">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search users..."
            class="px-4 py-2 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            (change)="onSearch()">
          
          <select [(ngModel)]="sortBy" (change)="onSort($event)"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Sort by...</option>
            <option value="firstName">First Name</option>
            <option value="email">Email</option>
            <option value="createdAt">Created Date</option>
          </select>

          <select [(ngModel)]="sortOrder" (change)="onSort($event)"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <select [(ngModel)]="pageSize" (change)="onPageSizeChange()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading users...</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="bg-white rounded-lg shadow">
        <app-admin-table
          [columns]="columns"
          [rows]="users"
          [actions]="tableActions"
          [sortColumn]="sortBy"
          [sortOrder]="sortOrder"
          (onSort)="onSort($event)">
        </app-admin-table>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1" class="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div class="text-gray-600">
          Page {{ currentPage }} of {{ totalPages }} (Total: {{ total }} users)
        </div>
        <div class="flex gap-2">
          <button (click)="previousPage()" [disabled]="currentPage === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            ← Previous
          </button>
          <button (click)="nextPage()" [disabled]="currentPage === totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
            Next →
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">
        {{ errorMessage }}
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;

  // Search and Sort
  searchTerm = '';
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Table configuration
  columns: Column[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'firstName', label: 'First Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phoneNo', label: 'Phone', sortable: false },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'isApproved', label: 'Status', sortable: true }
  ];

  tableActions: TableAction[] = [];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private usersService: UsersService, private router: Router) {
    this.setupTableActions();
  }

  ngOnInit() {
    this.loadUsers();
    this.setupSearchDebounce();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupTableActions() {
    this.tableActions = [
      {
        label: 'Edit',
        class: 'text-blue-600 hover:underline',
        action: (row: User) => this.router.navigate(['/admin/users/edit', row.id])
      },
      {
        label: 'Approve',
        class: 'text-green-600 hover:underline',
        action: (row: User) => this.approveUser(row)
      },
      {
        label: 'Delete',
        class: 'text-red-600 hover:underline',
        action: (row: User) => this.deleteUser(row)
      }
    ];
  }

  setupSearchDebounce() {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadUsers();
      });
  }

  loadUsers() {
    this.loading = true;
    this.errorMessage = '';

    this.usersService.getUsers({
      page: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.users = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  onSort(column: any) {
    if (typeof column === 'string') {
      if (this.sortBy === column) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = column;
        this.sortOrder = 'asc';
      }
    }
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadUsers();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  approveUser(user: User) {
    if (confirm(`Approve user ${user.firstName}?`)) {
      this.usersService.approveUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (error) => {
            console.error('Failed to approve user', error);
          }
        });
    }
  }

  deleteUser(user: User) {
    if (confirm(`Delete user ${user.firstName}? This action cannot be undone.`)) {
      this.usersService.deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (error) => {
            console.error('Failed to delete user', error);
          }
        });
    }
  }
}
