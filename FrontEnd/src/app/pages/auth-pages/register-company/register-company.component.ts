import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { RegisterCompanyFormComponent } from '../../../shared/components/auth/register-company-form/register-company-form.component';

@Component({
  selector: 'app-register-company',
  imports: [AuthPageLayoutComponent, RegisterCompanyFormComponent],
  templateUrl: './register-company.component.html',
  standalone: true,
  styles: ``
})
export class RegisterCompanyComponent {}
