import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { RouterModule, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';

// Custom validator for strong password
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  const password = control.value;
  const hasMinLength = password.length >= 8;
  const hasMaxLength = password.length <= 15;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasMinLength || !hasMaxLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
    return {
      weakPassword: {
        hasMinLength,
        hasMaxLength,
        hasUpperCase,
        hasNumber,
        hasSpecialChar
      }
    };
  }
  return null;
}

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
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

  // Helper methods for password validation
  hasMinLength(pwd: string): boolean {
    return pwd?.length >= 8;
  }

  hasMaxLength(pwd: string): boolean {
    return pwd?.length <= 15;
  }

  hasUpperCase(pwd: string): boolean {
    return /[A-Z]/.test(pwd || '');
  }

  hasNumber(pwd: string): boolean {
    return /[0-9]/.test(pwd || '');
  }

  hasSpecialChar(pwd: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd || '');
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, strongPasswordValidator]],
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


