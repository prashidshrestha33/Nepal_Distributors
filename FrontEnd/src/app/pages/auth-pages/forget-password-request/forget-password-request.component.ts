import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { ForgetPasswordRequestFormComponent } from '../../../shared/components/auth/forget-password-request-form/forget-password-request-form.component';

@Component({
  selector: 'forget-password-request',
  standalone:true,
  imports: [
    AuthPageLayoutComponent,
    ForgetPasswordRequestFormComponent,
  ],
  templateUrl: './forget-password-request.component.html',
  styles: ``
})
export class ForgetPasswordRequestComponent {

}
