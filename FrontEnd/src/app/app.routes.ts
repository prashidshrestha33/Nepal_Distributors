import { Routes } from '@angular/router';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { RegisterUser } from './pages/auth-pages/register-user/register-user.component';
import { ForgetPasswordComponent } from './pages/auth-pages/forget-password/forget-password.component';
import { ForgetPasswordRequestComponent } from './pages/auth-pages/forget-password-request/forget-password-request.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { RegisterCompanyComponent } from './pages/auth-pages/register-company/register-company.component';
import { TermsAndConditionsComponent } from './pages/auth-pages/terms-and-conditions/terms-and-conditions.component';
import { AuthGuard } from './guards/auth.guard';

// Management Components - Users
import { UsersComponent } from './shared/components/management/users/list/users.component';
import { UserFormComponent } from './shared/components/management/users/form/user-form.component';
// Management Components - Users
import { CompanyComponent } from './shared/components/management/company/list/company.component';
import { CompanyFormComponent } from './shared/components/management/company/form/Company-form.component';

// Management Components - Categories
import { CategoriesComponent } from './shared/components/management/categories/list/categories.component';
import { CategoryFormComponent } from './shared/components/management/categories/form/category-form.component';

// Management Components - Products
import { ProductsComponent as ProductsMgmtComponent } from './shared/components/management/products/list/products.component';
import { ProductFormComponent } from './shared/components/management/products/form/product-form.component';

// Management Components - Orders
import { OrdersComponent } from './shared/components/management/orders/list/orders.component';
import { OrderFormComponent } from './shared/components/management/orders/form/order-form.component';

// Management Components - Notifications
import { NotificationsComponent } from './shared/components/management/notifications/list/notifications.component';

// Management Components - Quotations
import { QuotationsComponent } from './shared/components/management/quotations/list/quotations.component';
import { QuotationFormComponent } from './shared/components/management/quotations/form/quotation-form.component';

// Management Components - Static Values
import { StaticValuesComponent } from './shared/components/management/static-values/list/static-values.component';
import { StaticValuesCatalogComponent } from './shared/components/management/static-values/Static-value-catalog/static-values-catalog.component';
import { StaticValueFormComponent } from './shared/components/management/static-values/form/static-value-form.component';
import { register } from 'swiper/element';

export const routes: Routes = [
  // Public auth pages
  
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Nepal Distributors - Sign In'
  },  {
    path: 'RegisterUser',
     loadComponent: () => import('./pages/auth-pages/register-user/register-user.component')
                     .then(m => m.RegisterUser),
    title: 'Nepal Distributors - Register User by componey'
  },{
    path: 'ForgetPassword',
     component: ForgetPasswordComponent,
    title: 'Nepal Distributors - Forget Pasword'
  },{
    path: 'ForgetPasswordRequest',
     component: ForgetPasswordRequestComponent,
    title: 'Nepal Distributors - Forget Pasword Request'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Nepal Distributors - Sign Up'
  },
  {
    path: 'register-company',
    component: RegisterCompanyComponent,
    title: 'Nepal Distributors - Register Company'
  },
  {
    path: 'terms-and-conditions',
    component: TermsAndConditionsComponent,
    title: 'Nepal Distributors - Terms and Conditions'
  },
  // Protected routes
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Management Routes - nested under /management
      {
        path: 'management',
        children: [
          {
            path: 'users',
            component: UsersComponent,
            title: 'Nepal Distributors - Users'
          },
          {
            path: 'users/add',
            component: UserFormComponent,
            title: 'Nepal Distributors - Add User'
          }, {
            path: 'company',
            component: CompanyComponent,
            title: 'Nepal Distributors - Company'
          },
          {
            path: 'company/add',
            component: CompanyFormComponent,
            title: 'Nepal Distributors - Add Company'
          },
          {
            path: 'categories',
            component: CategoriesComponent,
            title: 'Nepal Distributors - Categories'
          },
          {
            path: 'categories/add',
            component: CategoryFormComponent,
            title: 'Nepal Distributors - Add Category'
          },
          {
            path: 'products',
            component: ProductsMgmtComponent,
            title: 'Nepal Distributors - Products Management'
          },
          {
            path: 'products/edit/:id',
            loadComponent: () => import('./shared/components/management/products/edit/product-edit.component').then(m => m.ProductEditComponent),
            title: 'Nepal Distributors - Edit Product'
          },
          {
            path: 'products/add',
            component: ProductFormComponent,
            title: 'Nepal Distributors - Add Product'
          },
          {
            path: 'orders',
            component: OrdersComponent,
            title: 'Nepal Distributors - Orders'
          },
          {
            path: 'orders/add',
            component: OrderFormComponent,
            title: 'Nepal Distributors - Add Order'
          },
          {
            path: 'notifications',
            component: NotificationsComponent,
            title: 'Nepal Distributors - Notifications'
          },
          {
            path: 'quotations',
            component: QuotationsComponent,
            title: 'Nepal Distributors - Quotations'
          },
          {
            path: 'quotations/add',
            component: QuotationFormComponent,
            title: 'Nepal Distributors - Add Quotation'
          },
          {
            path: 'static-values',
            component: StaticValuesComponent,
            title: 'Nepal Distributors - Static Values'
          },
          {
            path: 'static-values-catalog',
            component: StaticValuesCatalogComponent,
            title: 'Nepal Distributors - Static Values Catalog'
          },
          {
            path: 'static-values/add',
            component: StaticValueFormComponent,
            title: 'Nepal Distributors - Add Static Value'
          }
        ]
      },
      // Fallback for old routes without /management prefix (for backward compatibility)
      {
        path: 'users',
        component: UsersComponent,
        title: 'Nepal Distributors - Users'
      },
      {
        path: 'users/add',
        component: UserFormComponent,
        title: 'Nepal Distributors - Add User'
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        title: 'Nepal Distributors - Categories'
      },
      {
        path: 'categories/add',
        component: CategoryFormComponent,
        title: 'Nepal Distributors - Add Category'
      },
      {
        path: 'products',
        component: ProductsMgmtComponent,
        title: 'Nepal Distributors - Products Management'
      },
      {
        path: 'products/add',
        component: ProductFormComponent,
        title: 'Nepal Distributors - Add Product'
      },
      {
        path: 'orders',
        component: OrdersComponent,
        title: 'Nepal Distributors - Orders'
      },
      {
        path: 'orders/add',
        component: OrderFormComponent,
        title: 'Nepal Distributors - Add Order'
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        title: 'Nepal Distributors - Notifications'
      },
      {
        path: 'quotations',
        component: QuotationsComponent,
        title: 'Nepal Distributors - Quotations'
      },
      {
        path: 'quotations/add',
        component: QuotationFormComponent,
        title: 'Nepal Distributors - Add Quotation'
      },
      {
        path: 'static-values',
        component: StaticValuesComponent,
        title: 'Nepal Distributors - Static Values'
      },
      {
        path: 'static-values-Catalog',
        component: StaticValuesCatalogComponent,
        title: 'Nepal Distributors - Static Values Catalog'
      },
      {
        path: 'static-values/add',
        component: StaticValueFormComponent,
        title: 'Nepal Distributors - Add Static Value'
      }
    ]
  },

  // 404 - Not Found
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Nepal Distributors - Not Found'
  }
];
