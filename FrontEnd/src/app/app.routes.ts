import { Routes } from '@angular/router';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { RegisterCompanyComponent } from './pages/auth-pages/register-company/register-company.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { ProductsComponent } from './pages/products/products.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminLayoutComponent } from './admin/shared/layout/admin-layout.component';
import { adminRoutes } from './admin/admin.routes';

export const routes: Routes = [
  // Default route - redirect to admin dashboard
  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  
  // Public auth pages (accessible without login)
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Nepal Distributors - Sign In'
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

  // Protected routes (requires authentication)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Nepal Distributors - Calendar'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Nepal Distributors - Profile'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Nepal Distributors - Forms'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Nepal Distributors - Tables'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Nepal Distributors - Blank'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Nepal Distributors - Invoices'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Nepal Distributors - Line Chart'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Nepal Distributors - Bar Chart'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Nepal Distributors - Alerts'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Nepal Distributors - Avatars'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Nepal Distributors - Badges'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Nepal Distributors - Buttons'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Nepal Distributors - Images'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Nepal Distributors - Videos'
      },
      {
        path: 'products',
        component: ProductsComponent,
        title: 'Nepal Distributors - Products'
      }
    ]
  },

  // Admin routes (requires authentication)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: adminRoutes
  },

  // 404 - Not Found (must be last)
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Nepal Distributors - Not Found'
  }
];
