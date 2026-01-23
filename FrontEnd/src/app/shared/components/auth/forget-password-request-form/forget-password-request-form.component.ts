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


@Component({
  selector: 'app-forget-password-request-form',
  imports: [
    CommonModule,
    LabelComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './forget-password-request-form.component.html',
  styles: './forget-password-request-form.component.css'
})
export class ForgetPasswordRequestFormComponent implements OnInit {
  showPassword = false;
  isglfb = false;
  signupForm!: FormGroup;
  errorMessage = '';
  emailConflictError = ''; // Track email conflict error separately
  isLoading = false;
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
  ) {}


  ngOnInit() {
  this.signupForm = this.formBuilder.group({
     email: ['', [Validators.required, emailFormatValidator]],
  });
  }
  async onSubmit(): Promise<void> {
    debugger;
    if (this.signupForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }
    const { email } = this.signupForm.value;

    
    
    this.isLoading = true;
    this.errorMessage = '';



    this.authService.forgetPasswordrequest(email).subscribe({
      next: (response: any) => {
        debugger;
        this.isLoading = false;
        const token = response?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        this.formDataService.clearAll();

          localStorage.removeItem('socialUser');
        this.successMessage = `Please Check your email id`;
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
          this.errorMessage = 'Please try again with valid email id the provided email doesent exist with us';
          
    localStorage.removeItem('socialUser');
          return;
        }

        console.error('Signup error:', error);
      }
    });
  }

  get email() {
    return this.signupForm.get('email');
  }


  /**
   * Navigate back to Step 1 (company registration)
   * Saves current form data to FormDataService before navigating
   * Sets flag in RegistrationFlowService to indicate coming from signup
   */
  goBack(): void {
    this.router.navigate(['/signin']);
  }
}


