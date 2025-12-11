import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { RouterModule, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';
import { SignupFlowService } from '../../../services/signup-flow.service';

@Component({
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    ButtonComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent implements OnInit {
  showPassword = false;
  signupForm!: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private router: Router,
    private flow: SignupFlowService
  ) {}

  ngOnInit() {
    this.signupForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      phoneNo: ['', [Validators.required]],
      role: ['', [Validators.required]],
      tier: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignUp() {
    if (this.signupForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    const { firstName, phoneNo, role, tier, email, password, agreeToTerms } = this.signupForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    // Build FormData to submit multipart/form-data
    const formData = new FormData();
    formData.append('Register.FullName', firstName || '');
    formData.append('Register.Phone', phoneNo || '');
    formData.append('Register.Role', role || '');
    formData.append('Register.Tier', tier || '');
    formData.append('Register.Email', email || '');
    formData.append('Register.Password', password || '');
    // Include company id from flow
    const companyId = this.flow.getCompanyId();
    if (companyId) {
      formData.append('Company.Id', String(companyId));
    }

    this.authService.registerStep2(formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const token = response?.token;
        if (token) {
          localStorage.setItem('token', token);
        }

        // Initialize inactivity timer
        this.inactivityService.initInactivityTimer();

        // Navigate to dashboard
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'An error occurred during signup. Please try again.';
        console.error('Signup error:', error);
      }
    });
  }

  get firstName() {
    return this.signupForm.get('firstName');
  }

  get phoneNo() {
    return this.signupForm.get('phoneNo');
  }

  get role() {
    return this.signupForm.get('role');
  }

  get tier() {
    return this.signupForm.get('tier');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get agreeToTerms() {
    return this.signupForm.get('agreeToTerms');
  }
}


