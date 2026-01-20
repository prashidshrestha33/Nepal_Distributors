import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { RegisteUserFormComponent } from '../../../shared/components/auth/registeuser-form/registeuser-form.component';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [
    AuthPageLayoutComponent,
    RegisteUserFormComponent
  ],
  templateUrl: './register-user.component.html',
  styles: ``
})
export class RegisterUser {}
