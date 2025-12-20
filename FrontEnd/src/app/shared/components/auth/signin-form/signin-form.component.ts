import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';

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
  returnUrl: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get return URL from route parameters or default to admin dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';

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

    // Call login with rememberMe flag
    this.authService.login(email, password, rememberMe).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        // Backend returns token inside result object: { result: { token: '...' } }
        const token = response?.result?.token || response?.token;
        if (token) {
          // Token is already saved by the service in the login method
          console.log('User logged in successfully');

          // Initialize inactivity timer after successful login
          this.inactivityService.initInactivityTimer();

          // Navigate to the return URL or dashboard
          const navigationPath = this.returnUrl.startsWith('/') 
            ? this.returnUrl 
            : '/' + this.returnUrl;
          
          this.router.navigate([navigationPath], { replaceUrl: true });
        } else {
          this.errorMessage = 'No token received from server. Please try again.';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        
        // Handle different error status codes
        if (error?.status === 401 || error?.status === 400) {
          this.errorMessage = 'Invalid username or password';
        } else if (error?.status === 403) {
          this.errorMessage = 'Access forbidden. Please contact administrator.';
        } else if (error?.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please check your connection.';
        } else {
          this.errorMessage = error?.error?.message || 'Login failed. Please try again.';
        }

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


