import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
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
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [AuthGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Nepal Distributors',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Nepal Distributors'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Nepal Distributors'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Nepal Distributors'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Nepal Distributors'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Nepal Distributors'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Nepal Distributors'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Nepal Distributors'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Nepal Distributors'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Nepal Distributors'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Nepal Distributors'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Nepal Distributors'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Nepal Distributors'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Nepal Distributors'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Nepal Distributors'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Nepal Distributors'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Nepal Distributors'
  },
  {
    path:'register-company',
    component:RegisterCompanyComponent,
    title:'Nepal Distributors'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Nepal Distributors'
  },
];
