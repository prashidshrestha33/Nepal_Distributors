import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { RouterModule, Router,ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';
import { SignupFlowService } from '../../../services/signup-flow.service';
import { FormDataService } from '../../../services/form-data.service';
import { RegistrationFlowService } from '../../../services/registration-flow.service';
import { SocialUser } from '../../../models/auth.models';  
import { EncryptionHelper } from '../../../services/encryption.service';  

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

// Custom validator for email format
function emailFormatValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // Allow empty (required validator handles it)
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(control.value)) {
    return { invalidEmailFormat: true };
  }
  
  return null;
}

// Custom validator for password mismatch
function passwordMismatchValidator(form: AbstractControl): ValidationErrors | null {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;
  
  if (!password || !confirmPassword) {
    return null; // Allow empty (required validator handles individual fields)
  }
  
  if (password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  
  return null;
}

@Component({
  selector: 'app-forget-password-form',
  imports: [
    CommonModule,
    LabelComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './forget-password-form.component.html',
  styles: ``
})
export class ForgetPasswordFormComponent implements OnInit {
  showPassword = false;
  isglfb = false;
  signupForm!: FormGroup;
  errorMessage = '';
  emailConflictError = ''; // Track email conflict error separately
  isLoading = false;
  // optional: preview/filename for uploaded company document when re-uploading in step2
  companyFileName: string | null = null;
  showSuccessMessage = false;
  successMessage = '';
  token: string | null = null;
  Componeyname: string | null = null;
  Componeyid: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private inactivityService: InactivityService,
    private router: Router,
    public flow: SignupFlowService,
    private formDataService: FormDataService,
    private registrationFlowService: RegistrationFlowService,
    private encryptiondec: EncryptionHelper ,
    private route:  ActivatedRoute
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
    const token = this.route.snapshot.queryParamMap.get('token') || '';
     this.token = token || null;
   const Redirecturl = localStorage.getItem('redirecturl');
   if(this.token||Redirecturl!=undefined||Redirecturl!=''){
   
   }
   const sSocialUser = localStorage.getItem('socialUser');
let socialUser: SocialUser | null = null;
let isSocialSignup = false;
debugger;
   
  // Regular signup (no social user)
  this.signupForm = this.formBuilder.group({
    password: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMismatchValidator });
    
    // Listen to email field changes to clear email conflict error
    this.signupForm.get('email')?.valueChanges.subscribe(() => {
      this.emailConflictError = ''; 
    });
  }

 

  // Allow re-uploading the company document while on step 2 if the file was lost
  onCompanyFileChange(event?: Event) {
    const input = (event?.target as HTMLInputElement) || null;
    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      this.companyFileName = file.name;
      const existing = this.flow.getCompanyForm() || {};
      existing.file = file;
      this.flow.setCompanyForm(existing);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSignUp(): Promise<void> {
    debugger;
    if (this.signupForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }
    const { firstName, phoneNo, email, password, confirmPassword,provider,id,token } = this.signupForm.value;
    
    // Verify passwords match (extra safety check)
    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    
    
    this.isLoading = true;
    this.errorMessage = '';

    const formData = new FormData();
debugger;
    // Company fields (use backend expected keys; include the misspelled `CompamyPerson`)
  const body = {
  Password: password || '',
  Token: this.token || ''
};


    this.authService.forgetPassword(body).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const token = response?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        this.formDataService.clearAll();

          localStorage.removeItem('socialUser');
        this.successMessage = `Your Password has been Changed`;
        this.showSuccessMessage = true;
        this.inactivityService.initInactivityTimer();

        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 1000);
        setTimeout(() => {
          this.router.navigate(['/signin'], { replaceUrl: true });
        }, 6000);
      },
      error: (error: any) => {
        debugger;
        this.isLoading = false;
        if (error?.status === 409) {
          this.errorMessage = 'Token already Expired Please Re-Generate the link again';
          
    localStorage.removeItem('socialUser');
          return;
        }

        console.error('Signup error:', error);
      }
    });
  }

  /**
   * Returns a list of invalid controls' friendly names for display
   */
  getInvalidControls(): string[] {
    if (!this.signupForm) return [];
    const map: Record<string, string> = {
      firstName: 'Full Name',
      phoneNo: 'Phone Number',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      agreeToTerms: 'Terms and Conditions'
    };
    return Object.keys(this.signupForm.controls)
      .filter(k => this.signupForm.get(k)?.invalid)
      .map(k => map[k] || k);
  }

  get firstName() {
    return this.signupForm.get('firstName');
  }

  get phoneNo() {
    return this.signupForm.get('phoneNo');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  get agreeToTerms() {
    return this.signupForm.get('agreeToTerms');
  }

  /**
   * Navigate back to Step 1 (company registration)
   * Saves current form data to FormDataService before navigating
   * Sets flag in RegistrationFlowService to indicate coming from signup
   */
  goBack(): void {
    const formValues = this.signupForm.value;
    this.formDataService.saveUserData({
      firstName: formValues.firstName,
      phoneNo: formValues.phoneNo,
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword,
      agreeToTerms: true,
      provider: formValues.provider,
      id: formValues.id,
      token: formValues.token
    });
    
    // Set flag indicating user is coming from signup form
    this.registrationFlowService.setComingFromSignup(true);
    this.registrationFlowService.setStep(1);
    
    this.router.navigate(['/register-company']);
  }
}


