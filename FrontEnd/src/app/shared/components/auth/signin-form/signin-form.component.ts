import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent implements OnInit {
  showPassword = false;
  loginForm!: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        // Backend should return { token: 'JWT-TOKEN' }
        const token = response?.token;
        if (token) {
          // Save token to localStorage as requested
          localStorage.setItem('token', token);
        }

        // Initialize inactivity timer after successful login
        this.inactivityService.initInactivityTimer();

        // Navigate to dashboard on success
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Invalid email or password';
        console.error('Login error:', error);
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }
}


