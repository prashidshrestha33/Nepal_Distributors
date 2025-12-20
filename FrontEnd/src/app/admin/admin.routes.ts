import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./modules/users/users-list/users-list.component').then(m => m.UsersListComponent),
    data: { title: 'Users' }
  },
  {
    path: 'users/add',
    loadComponent: () => import('./modules/users/users-form/users-form.component').then(m => m.UsersFormComponent),
    data: { title: 'Add User' }
  },
  {
    path: 'users/edit/:id',
    loadComponent: () => import('./modules/users/users-form/users-form.component').then(m => m.UsersFormComponent),
    data: { title: 'Edit User' }
  },
  {
    path: 'categories',
    loadComponent: () => import('./modules/categories/categories-list/categories-list.component').then(m => m.CategoriesListComponent),
    data: { title: 'Categories' }
  },
  {
    path: 'categories/add',
    loadComponent: () => import('./modules/categories/categories-form/categories-form.component').then(m => m.CategoriesFormComponent),
    data: { title: 'Add Category' }
  },
  {
    path: 'categories/edit/:id',
    loadComponent: () => import('./modules/categories/categories-form/categories-form.component').then(m => m.CategoriesFormComponent),
    data: { title: 'Edit Category' }
  },
  {
    path: 'products',
    loadComponent: () => import('./modules/products/products-list/products-list.component').then(m => m.ProductsListComponent),
    data: { title: 'Products' }
  },
  {
    path: 'products/add',
    loadComponent: () => import('./modules/products/products-form/products-form.component').then(m => m.ProductsFormComponent),
    data: { title: 'Add Product' }
  },
  {
    path: 'products/edit/:id',
    loadComponent: () => import('./modules/products/products-form/products-form.component').then(m => m.ProductsFormComponent),
    data: { title: 'Edit Product' }
  },
  {
    path: 'orders',
    loadComponent: () => import('./modules/orders/orders-list/orders-list.component').then(m => m.OrdersListComponent),
    data: { title: 'Orders' }
  },
  {
    path: 'orders/add',
    loadComponent: () => import('./modules/orders/orders-form/orders-form.component').then(m => m.OrdersFormComponent),
    data: { title: 'Add Order' }
  },
  {
    path: 'notifications',
    loadComponent: () => import('./modules/notifications/notifications-list/notifications-list.component').then(m => m.NotificationsListComponent),
    data: { title: 'Notifications' }
  },
  {
    path: 'quotations',
    loadComponent: () => import('./modules/quotations/quotations-list/quotations-list.component').then(m => m.QuotationsListComponent),
    data: { title: 'Quotations' }
  },
  {
    path: 'quotations/add',
    loadComponent: () => import('./modules/quotations/quotations-form/quotations-form.component').then(m => m.QuotationsFormComponent),
    data: { title: 'Add Quotation' }
  },
  {
    path: 'static-values',
    loadComponent: () => import('./modules/static-values/static-values-list/static-values-list.component').then(m => m.StaticValuesListComponent),
    data: { title: 'Static Values' }
  },
  {
    path: 'static-values/add',
    loadComponent: () => import('./modules/static-values/static-values-form/static-values-form.component').then(m => m.StaticValuesFormComponent),
    data: { title: 'Add Static Value' }
  },
  {
    path: 'static-values/edit/:id',
    loadComponent: () => import('./modules/static-values/static-values-form/static-values-form.component').then(m => m.StaticValuesFormComponent),
    data: { title: 'Edit Static Value' }
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    data: { title: 'Dashboard' }
  },
  {
    path: 'audit-logs',
    loadComponent: () => import('./modules/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
    data: { title: 'Audit Logs' }
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
