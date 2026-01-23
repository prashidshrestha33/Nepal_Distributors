import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { ForgetPasswordFormComponent } from '../../../shared/components/auth/forget-password-form/forget-password-form.component';

@Component({
  selector: 'app-forget-password',
  standalone:true,
  imports: [
    AuthPageLayoutComponent,
    ForgetPasswordFormComponent,
  ],
  templateUrl: './forget-password.component.html',
  styles: ``
})
export class ForgetPasswordComponent {

}
