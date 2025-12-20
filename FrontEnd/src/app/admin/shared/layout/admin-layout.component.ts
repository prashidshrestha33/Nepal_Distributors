import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-gray-900 text-white shadow-lg overflow-y-auto">
        <div class="p-6 border-b border-gray-700">
          <h1 class="text-2xl font-bold">Admin Panel</h1>
        </div>
        
        <nav class="p-4 space-y-2">
          <div *ngFor="let item of navItems">
            <button (click)="toggleMenu(item)"
              class="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              [class.bg-gray-800]="isMenuOpen(item)">
              <span class="flex items-center gap-2">
                <span class="text-xl">{{ item.icon }}</span>
                {{ item.label }}
              </span>
              <span *ngIf="item.children" class="text-sm">
                {{ isMenuOpen(item) ? '▼' : '▶' }}
              </span>
            </button>
            
            <!-- Submenu -->
            <div *ngIf="item.children && isMenuOpen(item)" class="pl-4 space-y-1 mt-1">
              <a *ngFor="let child of item.children"
                [routerLink]="child.route"
                routerLinkActive="bg-gray-800"
                class="block px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition">
                {{ child.label }}
              </a>
            </div>
            
            <!-- Direct link -->
            <a *ngIf="!item.children"
              [routerLink]="item.route"
              routerLinkActive="bg-gray-800"
              class="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              [class.bg-gray-800]="isActive(item.route)">
              <span class="text-xl">{{ item.icon }}</span>
              <span class="text-sm">{{ item.label }}</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Bar -->
        <header class="bg-white shadow">
          <div class="px-6 py-4 flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">{{ pageTitle }}</h2>
            <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Logout
            </button>
          </div>
        </header>

        <!-- Content Area -->
        <main class="flex-1 overflow-auto p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  pageTitle = 'Dashboard';
  openMenus: Set<NavItem> = new Set();

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: '📊',
      route: '/admin/dashboard'
    },
    {
      label: 'Users',
      icon: '👥',
      route: '/admin/users',
      children: [
        { label: 'List Users', icon: '📋', route: '/admin/users' },
        { label: 'Add User', icon: '➕', route: '/admin/users/add' }
      ]
    },
    {
      label: 'Categories',
      icon: '📂',
      route: '/admin/categories',
      children: [
        { label: 'List Categories', icon: '📋', route: '/admin/categories' },
        { label: 'Add Category', icon: '➕', route: '/admin/categories/add' }
      ]
    },
    {
      label: 'Products',
      icon: '📦',
      route: '/admin/products',
      children: [
        { label: 'List Products', icon: '📋', route: '/admin/products' },
        { label: 'Add Product', icon: '➕', route: '/admin/products/add' }
      ]
    },
    {
      label: 'Orders',
      icon: '🛒',
      route: '/admin/orders',
      children: [
        { label: 'List Orders', icon: '📋', route: '/admin/orders' },
        { label: 'Add Order', icon: '➕', route: '/admin/orders/add' }
      ]
    },
    {
      label: 'Notifications',
      icon: '🔔',
      route: '/admin/notifications'
    },
    {
      label: 'Quotations',
      icon: '📄',
      route: '/admin/quotations',
      children: [
        { label: 'List Quotations', icon: '📋', route: '/admin/quotations' },
        { label: 'Add Quotation', icon: '➕', route: '/admin/quotations/add' }
      ]
    },
    {
      label: 'Static Values',
      icon: '⚙️',
      route: '/admin/static-values',
      children: [
        { label: 'List Values', icon: '📋', route: '/admin/static-values' },
        { label: 'Add Value', icon: '➕', route: '/admin/static-values/add' }
      ]
    },
    {
      label: 'Audit Logs',
      icon: '📜',
      route: '/admin/audit-logs'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  toggleMenu(item: NavItem) {
    if (item.children) {
      if (this.openMenus.has(item)) {
        this.openMenus.delete(item);
      } else {
        this.openMenus.add(item);
      }
    }
  }

  isMenuOpen(item: NavItem): boolean {
    return this.openMenus.has(item);
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  logout() {
    // Clear auth and redirect
    localStorage.removeItem('token');
    this.router.navigate(['/signin']);
  }
}
