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
import { EncryptionService } from '../../../services/encryption.service';  
import { UiService } from '../../../../../app/ui.service';
import { OtpPopupComponent } from '../../../components/CustomComponents/otp-popup/otp-popup.component';

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
  selector: 'app-signup-form',
  imports: [
    CommonModule,
    LabelComponent,
    RouterModule,
    ReactiveFormsModule,
    OtpPopupComponent  
  ],
  templateUrl: './signup-form.component.html',
  styles: ``
})
export class SignupFormComponent implements OnInit {
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
  returnUrl: string | null = null;
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
     private encryptionService: EncryptionService,
    private route:  ActivatedRoute, 
    public ui: UiService
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
     this.returnUrl = token || null;
   const Redirecturl = localStorage.getItem('redirecturl');
   
   const sSocialUser = localStorage.getItem('socialUser');
let socialUser: SocialUser | null = null;
let isSocialSignup = false;
debugger;
if (sSocialUser) {
  try {
    socialUser = JSON.parse(sSocialUser) as SocialUser;
    isSocialSignup = true;
    
    if (socialUser.provider === "GOOGLE" || socialUser.provider === "FACEBOOK") {
      this.isglfb = true;
      if(this.returnUrl){
// ✅ Create form for social signup
      this.signupForm = this.formBuilder.group({
        firstName: ['', [Validators.required]],
        phoneNo: ['', [Validators.required]],
        email: ['', [Validators.required, emailFormatValidator]],
        isemailvalid: [''],
        password:  [''],
        confirmPassword: [''],
         agreeToTerms: [false, [Validators.requiredTrue]],
    provider: [''],
    id: [''],
    token: ['']    // ✅ Changed from requiredTrue
      });
      }
      else{
        debugger;
        // ✅ Create form for social signup
      this.signupForm = this.formBuilder.group({
        firstName: ['', [Validators.required]],
        phoneNo: ['', [Validators.required]],
        email: ['', [Validators.required, emailFormatValidator]],     
        password:  [''],
        confirmPassword: [''],
        agreeToTerms: [false, [Validators.requiredTrue]],
        provider: ['', [Validators.required]],  // ✅ Changed from requiredTrue
        id: ['', [Validators.required]],        // ✅ Changed from requiredTrue
        token: ['', [Validators.required]]      // ✅ Changed from requiredTrue
      });
      }
      
      // ✅ FIXED: Use this.signupForm instead of this.formBuilder
      this.signupForm.patchValue({
        firstName: socialUser.name,
        email: socialUser.email,
        provider: socialUser.provider,
        id: socialUser.id,
        token: socialUser.token
      });
      
      console.log('✅ Social user values set:', this.signupForm. value);
      
    } else {
      // Non-Google/Facebook provider
      this.signupForm = this.formBuilder.group({
        firstName: ['', [Validators.required]],
        phoneNo: ['', [Validators.required]],
        email: ['', [Validators.required, emailFormatValidator]],   
        password:  [''],
        confirmPassword: [''],
        agreeToTerms: [false, [Validators.requiredTrue]],
        provider: [''],
        id: [''],
        token: ['']
      }, { validators: passwordMismatchValidator });
          const savedUserData = this.formDataService.getUserData();
         
     
    if (savedUserData) {
      this.signupForm.patchValue({
        firstName: savedUserData.firstName,
        phoneNo: savedUserData.phoneNo,
        email: savedUserData.email,
        password: savedUserData.password,
        confirmPassword: savedUserData.confirmPassword
      });
    }
    
    }
    
    console.log('✅ Social user detected:', socialUser);
    
  } catch (error) {
    console.error('❌ Error parsing socialUser:', error);
    localStorage.removeItem('socialUser');
    
  }
  finally{
    
  }
} 
else if(!sSocialUser && this.returnUrl){
  debugger;
 this.signupForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    phoneNo: [''],
    email: ['', [Validators. required, emailFormatValidator]],
    password: [''],
    confirmPassword: [''],
    agreeToTerms: [false, [Validators.requiredTrue]],
    provider: [''],
    id: [''],
    token: ['']
  }, { validators: passwordMismatchValidator });
    if(this.returnUrl||Redirecturl!=undefined||Redirecturl!=''){
    const decryptedData = token
  ? this.encryptionService.decrypt<{ CompanyEmail: string }>(token)
  : null;
if (decryptedData && decryptedData.CompanyEmail) {
  this.signupForm.patchValue({
    email: decryptedData.CompanyEmail,
    firstName: decryptedData.CompanyEmail.split('@')[0],
  });
} else {
  console.warn('Decrypted token is invalid or does not contain CompanyEmail');
}
   }

}
  
  else {
  // Regular signup (no social user)
  this.signupForm = this.formBuilder.group({
    firstName: ['', [Validators.required]],
    phoneNo: ['', [Validators.required]],
    email: ['', [Validators. required, emailFormatValidator]],
   isemailvalid: [false, [Validators.requiredTrue]],
    password: [''],
    confirmPassword: [''],
    agreeToTerms: [false, [Validators.requiredTrue]],
    provider: [''],
    id: [''],
    token: ['']
  }, { validators: passwordMismatchValidator });
      const savedUserData = this.formDataService.getUserData();
    if (savedUserData) {
      this.signupForm.patchValue({
        firstName: savedUserData.firstName,
        phoneNo: savedUserData.phoneNo,
        email: savedUserData.email,
        password: savedUserData.password,
        confirmPassword: savedUserData.confirmPassword
      });
    }
}
    // Listen to email field changes to clear email conflict error
    this.signupForm.get('email')?.valueChanges.subscribe(() => {
      this.emailConflictError = ''; // Clear email conflict error when user types
    });

    // Ensure we have company data from Step 1. If not present, redirect user back.
    const companyData = this.flow.getCompanyForm();
    if (!companyData &&!this.returnUrl) {
      // No company data found (possibly page refresh). Redirect to company step.
      this.router.navigate(['/register-company']);
      return;
    }

    // Load company file from IndexDB if available
    this.loadCompanyFileFromIndexDB();
  }

  /**
   * Load company document from IndexDB
   */
  private async loadCompanyFileFromIndexDB(): Promise<void> {
    try {
      const fileFromIDB = await this.flow.getCompanyFileFromIDB();
      if (fileFromIDB) {
        this.companyFileName = fileFromIDB.name;
        console.log('Company document loaded from IndexDB:', this.companyFileName);
      }
    } catch (e) {
      console.warn('Error loading company file from IndexDB:', e);
    }
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
    if (this.signupForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }
    const { firstName, phoneNo, email, password, confirmPassword,provider,id,token } = this.signupForm.value;
    
    // Verify passwords match (extra safety check)
   
    
    // Save user data to FormDataService before submission
    this.formDataService.saveUserData({
      firstName,
      phoneNo,
      email,
      password,
      confirmPassword,
      agreeToTerms: true,
      provider,
      id,
      token
    });
    
    this.isLoading = true;
    this.errorMessage = '';

    // Get company data saved in step 1
    const companyData = this.flow.getCompanyForm();
    if (!companyData) {
      this.isLoading = false;
      this.errorMessage = 'Company information is missing. Please go back and complete Step 1.';
      return;
    }

    // Build a single FormData payload containing both Company.* and Register.* fields
    const formData = new FormData();

    // Company fields (use backend expected keys; include the misspelled `CompamyPerson`)
    formData.append('Company.Name', companyData.name || '');
    formData.append('Company.CompamyPerson', companyData.companyPerson || '');
    formData.append('Company.MobilePhone', companyData.mobilePhone || '');
    formData.append('Company.LandLinePhone', companyData.landLinePhone || '');
    formData.append('Company.CompanyType', companyData.companyType || '');
    formData.append('Company.Address', companyData.address || '');
    formData.append('Company.GoogleMapLocation', companyData.googleMapLocation || '');
    formData.append('Company.Status', companyData.status || '');

    // Append file if available (file might be null after full page refresh)
    let fileFromFlow: File | undefined = companyData.file;
    // If the File object isn't in-memory (lost after a refresh), first try DataURL, then IndexedDB
    if (!fileFromFlow) {
      fileFromFlow = this.flow.getCompanyFileFromStorage() || undefined;
    }
    if (!fileFromFlow) {
      // try IndexedDB (async)
      fileFromFlow = (await this.flow.getCompanyFileFromIDB()) || undefined;
    }

    if (fileFromFlow) {
      formData.append('CompanyDocument', fileFromFlow, fileFromFlow.name);
    } else {
      // If the file is missing, require the user to re-upload or go back to Step 1
      this.isLoading = false;
      this.errorMessage = 'Company document is missing. Please re-upload it or go back to Step 1.';
      return;
    }
    // Register (user) fields
    formData.append('Register.FullName', firstName || '');
    formData.append('Register.Phone', phoneNo || '');
    formData.append('Register.Email', email || '');
    formData.append('Register.Password', password || '');
    formData.append('Register.Provider', provider || '');
    formData.append('Register.ID', id || '');
    formData.append('Register.Token',token || '');

    // Debug log (dev only)

    
    formData.append('Token',this.returnUrl || '');
    try {
      for (const pair of (formData as any).entries()) {
        console.debug('[registernewuser] formData', pair[0], pair[1]);
      }
    } catch (e) {}

    // Submit combined payload to backend (single call)
    this.authService.registerStep2(formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const token = response?.token;
        if (token) {
          localStorage.setItem('token', token);
        }

        // Get company name before clearing
        const companyName = this.flow.getCompanyForm()?.name || 'Your Company';

        // Clear transient company data
        this.flow.clearCompanyForm();
        
        // Clear FormDataService data after successful registration
        this.formDataService.clearAll();

          localStorage.removeItem('socialUser');
        // Show success message
        this.successMessage = `${companyName} has been Registered Successfully. Please wait for Admin to Approve your Request.`;
        this.showSuccessMessage = true;

        // Initialize inactivity timer
        this.inactivityService.initInactivityTimer();

        // Hide success message after 4 seconds
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 1000);

        // Navigate to signin after 4 seconds
        setTimeout(() => {
          this.router.navigate(['/signin'], { replaceUrl: true });
        }, 6000);
      },
      error: (error: any) => {
        this.isLoading = false;
        
        // Check for 409 Conflict status (email already exists)
        if (error?.status === 409) {
          this.emailConflictError = 'Email already exists';
          this.errorMessage = ''; // Clear general error message
          
    localStorage.removeItem('socialUser');
          return;
        }

        // Try to surface server validation messages for other errors
        if (error?.error) {
          const payload = error.error;
          if (payload?.errors && typeof payload.errors === 'object') {
            const messages: string[] = [];
            Object.keys(payload.errors).forEach(k => {
              const v = payload.errors[k];
              if (Array.isArray(v)) messages.push(...v.map((m: any) => m.toString()));
              else if (typeof v === 'string') messages.push(v);
            });
            this.errorMessage = messages.join('; ') || payload?.message || 'Validation failed during signup.';
          } else {
            this.errorMessage = payload?.message || 'An error occurred during signup. Please try again.';
          }
        } else {
          this.errorMessage = 'An error occurred during signup. Please try again.';
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

  onEmailValidatebtnclick(){
    const formValues = this.signupForm.value;
     if(formValues.email== null||formValues.email==""){
      this.emailConflictError="Email is Required";
      return;
     }
       this.authService.SendRegisterOPT(formValues.email).subscribe({
      next: (response: any) => {
       this.ui.openOtp(); 
      },
      error: (error: any) => {   
         this.errorMessage = error.message;
      }
    });
  }

   verifyOtp(otp: string) {
    debugger;
        const formValues = this.signupForm.value;
     
       this.authService.ValidateRegisterOPT(formValues.email,otp).subscribe({
      next: (response: any) => {
          this.signupForm.patchValue({
            isemailvalid:true
      });
      },
      error: (error: any) => {   
         this.emailConflictError = error.error.message;
      }
    });
    
}

sendOtpAgain() {
      this.ui.closeOtp();
  this.onEmailValidatebtnclick();
     
}
}


