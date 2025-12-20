import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  pendingApprovals: number;
  totalCategories: number;
  activeNotifications: number;
  totalQuotations: number;
  monthlyRevenue?: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <!-- Page Header -->
      <div class="mb-8 pb-6 border-b border-gray-200">
        <h1 class="text-4xl font-bold text-gray-800">Dashboard</h1>
        <p class="text-gray-600 mt-2">Welcome back! Here's your system overview.</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Stats Grid -->
      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <!-- Total Users Card -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-blue-100 text-sm font-medium">Total Users</p>
              <p class="text-3xl font-bold mt-2">{{ stats.totalUsers }}</p>
            </div>
            <div class="text-4xl opacity-30">👥</div>
          </div>
        </div>

        <!-- Total Products Card -->
        <div class="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-green-100 text-sm font-medium">Total Products</p>
              <p class="text-3xl font-bold mt-2">{{ stats.totalProducts }}</p>
            </div>
            <div class="text-4xl opacity-30">📦</div>
          </div>
        </div>

        <!-- Total Orders Card -->
        <div class="bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-orange-100 text-sm font-medium">Total Orders</p>
              <p class="text-3xl font-bold mt-2">{{ stats.totalOrders }}</p>
            </div>
            <div class="text-4xl opacity-30">🛒</div>
          </div>
        </div>

        <!-- Pending Approvals Card -->
        <div class="bg-gradient-to-br from-red-500 to-red-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-red-100 text-sm font-medium">Pending Approvals</p>
              <p class="text-3xl font-bold mt-2">{{ stats.pendingApprovals }}</p>
            </div>
            <div class="text-4xl opacity-30">⏳</div>
          </div>
        </div>

        <!-- Total Categories Card -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-purple-100 text-sm font-medium">Total Categories</p>
              <p class="text-3xl font-bold mt-2">{{ stats.totalCategories }}</p>
            </div>
            <div class="text-4xl opacity-30">📂</div>
          </div>
        </div>

        <!-- Active Notifications Card -->
        <div class="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-yellow-100 text-sm font-medium">Active Notifications</p>
              <p class="text-3xl font-bold mt-2">{{ stats.activeNotifications }}</p>
            </div>
            <div class="text-4xl opacity-30">🔔</div>
          </div>
        </div>

        <!-- Total Quotations Card -->
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-indigo-100 text-sm font-medium">Total Quotations</p>
              <p class="text-3xl font-bold mt-2">{{ stats.totalQuotations }}</p>
            </div>
            <div class="text-4xl opacity-30">📋</div>
          </div>
        </div>

        <!-- Monthly Revenue Card -->
        <div class="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg shadow-md p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-cyan-100 text-sm font-medium">Monthly Revenue</p>
              <p class="text-3xl font-bold mt-2">{{ stats.monthlyRevenue ? ('Rs. ' + (stats.monthlyRevenue | number:'1.0-0')) : 'N/A' }}</p>
            </div>
            <div class="text-4xl opacity-30">💰</div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Admin Modules Section -->
      <div class="mb-10">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Admin Modules</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Users Module -->
          <a href="/admin/users" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-600">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Users</h3>
                <p class="text-gray-600 text-sm mt-1">Manage user accounts & roles</p>
              </div>
              <span class="text-3xl">👥</span>
            </div>
          </a>

          <!-- Products Module -->
          <a href="/admin/products" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-green-600">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Products</h3>
                <p class="text-gray-600 text-sm mt-1">Manage inventory & pricing</p>
              </div>
              <span class="text-3xl">📦</span>
            </div>
          </a>

          <!-- Orders Module -->
          <a href="/admin/orders" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-orange-600">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Orders</h3>
                <p class="text-gray-600 text-sm mt-1">Track customer orders</p>
              </div>
              <span class="text-3xl">🛒</span>
            </div>
          </a>

          <!-- Categories Module -->
          <a href="/admin/categories" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-600">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Categories</h3>
                <p class="text-gray-600 text-sm mt-1">Organize products</p>
              </div>
              <span class="text-3xl">📂</span>
            </div>
          </a>

          <!-- Notifications Module -->
          <a href="/admin/notifications" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-yellow-600">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Notifications</h3>
                <p class="text-gray-600 text-sm mt-1">Manage system alerts</p>
              </div>
              <span class="text-3xl">🔔</span>
            </div>
          </a>

          <!-- Quotations Module -->
          <a href="/admin/quotations" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-indigo-600">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-800">Quotations</h3>
                <p class="text-gray-600 text-sm mt-1">Handle quotation requests</p>
              </div>
              <span class="text-3xl">📋</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Advanced Features Section -->
      <div class="mb-10">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Features & Tools</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Bulk Operations -->
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-800">Bulk Operations</h3>
              <span class="text-2xl">⚡</span>
            </div>
            <p class="text-gray-600 text-sm">Approve, reject, delete or toggle status for multiple items</p>
          </div>

          <!-- Export Data -->
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-800">Export to CSV/JSON</h3>
              <span class="text-2xl">📥</span>
            </div>
            <p class="text-gray-600 text-sm">Download list data in CSV or JSON format</p>
          </div>

          <!-- Advanced Filters -->
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-600">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-800">Advanced Filters</h3>
              <span class="text-2xl">🔍</span>
            </div>
            <p class="text-gray-600 text-sm">Filter by text, date, status, numbers and more</p>
          </div>

          <!-- Audit Logs -->
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-800">Audit Trail</h3>
              <span class="text-2xl">📜</span>
            </div>
            <p class="text-gray-600 text-sm">Track all CREATE, UPDATE, DELETE, APPROVE, REJECT actions</p>
          </div>

          <!-- File Upload -->
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-600">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-800">Secure File Upload</h3>
              <span class="text-2xl">📁</span>
            </div>
            <p class="text-gray-600 text-sm">Upload images & documents with validation (5MB max)</p>
          </div>

          <!-- Real-Time Updates -->
          <div class="bg-white rounded-lg shadow-md p-6 border-t-4 border-cyan-600">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-semibold text-gray-800">Real-Time Updates</h3>
              <span class="text-2xl">🔄</span>
            </div>
            <p class="text-gray-600 text-sm">Live WebSocket sync with auto-reconnect & fallback</p>
          </div>
        </div>
      </div>

      <!-- Security Section -->
      <div class="mb-10">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Security & Access</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-800">Role-Based Access</h3>
              <span class="text-2xl">🔐</span>
            </div>
            <p class="text-gray-600 text-sm">Admin roles with module-specific permissions</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-800">Approval Authority</h3>
              <span class="text-2xl">✅</span>
            </div>
            <p class="text-gray-600 text-sm">Control who can approve or reject items</p>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-gray-800">Activity Tracking</h3>
              <span class="text-2xl">👁️</span>
            </div>
            <p class="text-gray-600 text-sm">Complete audit logs of all system actions</p>
          </div>
        </div>
      </div>

      <!-- Additional Tools -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Additional Tools</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/admin/audit-logs"
            class="px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium transition flex items-center gap-2"
          >
            <span>📜</span> View Audit Logs
          </a>
          <a 
            href="/admin/notifications"
            class="px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium transition flex items-center gap-2"
          >
            <span>🔔</span> Manage Notifications
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    totalCategories: 0,
    activeNotifications: 0,
    totalQuotations: 0,
    monthlyRevenue: 0
  };

  loading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<DashboardStats>(`${this.apiUrl}/api/dashboard/stats`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load dashboard stats:', error);
          this.errorMessage = 'Failed to load dashboard statistics';
          this.loading = false;
          // Provide default stats for demonstration
          this.stats = {
            totalUsers: 45,
            totalProducts: 230,
            totalOrders: 127,
            pendingApprovals: 12,
            totalCategories: 15,
            activeNotifications: 8,
            totalQuotations: 34,
            monthlyRevenue: 125000
          };
        }
      });
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}
