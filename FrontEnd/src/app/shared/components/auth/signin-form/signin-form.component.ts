// signin-form.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';
import { SocialAuthSimpleService } from '../../../services/social-auth-simple.service';
import { SocialUser } from '../../../models/auth.models';  // Import SocialUser, not SocialLoginRequest

@Component({
  selector: 'app-signin-form',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl:  './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent implements OnInit {
  showPassword = false;
  loginForm! : FormGroup;
  errorMessage = '';
  isLoading = false;
  isSocialLoading = false;
  returnUrl: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private socialAuthService: SocialAuthSimpleService,
    private inactivityService: InactivityService,
    private router: Router,
    private route:  ActivatedRoute
  ) {
    console.log('SigninFormComponent initialized');
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.loginForm = this. formBuilder.group({
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

    const { email, password, rememberMe } = this.loginForm. value;
    this.isLoading = true;
    this. errorMessage = '';

    this. authService.login(email, password, rememberMe).subscribe({
      next: (response:  any) => {
        this.isLoading = false;
        const token = response?.result?.token || response?.token;
        
        if (token) {
          console.log('User logged in successfully');
          this.inactivityService.initInactivityTimer();
          this.navigateAfterLogin();
        } else {
          this.errorMessage = 'No token received from server. ';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this. handleError(error);
      }
    });
  }

  signInWithGoogle() {
    // Prevent double-click
    if (this.isSocialLoading) {
      console.warn('⚠️ Social login already in progress');
      return;
    }

    this.isSocialLoading = true;
    this. errorMessage = '';
    console. log('🔵 Initiating Google sign-in...');

    this.socialAuthService.signInWithGoogle()
      .then(user => {
        console. log('Google sign-in successful:', user);
        this.handleSocialLogin(user);  // Pass entire user object
      })
      .catch(error => {
        this.isSocialLoading = false;
        console.error(' Google sign-in failed:', error);
        this.errorMessage = error?. message || 'Google sign-in failed. Please try again.';
      });
  }

  signInWithFacebook() {
    // Prevent double-click
    if (this. isSocialLoading) {
      console.warn('⚠️ Social login already in progress');
      return;
    }

    this.isSocialLoading = true;
    this.errorMessage = '';
    console.log('🔵 Initiating Facebook sign-in...');

    this.socialAuthService.signInWithFacebook()
      .then(user => {
        console.log('Facebook sign-in successful:', user);
        this.handleSocialLogin(user);  // Pass entire user object
      })
      .catch(error => {
        this.isSocialLoading = false;
        console. error(' Facebook sign-in failed:', error);
        this.errorMessage = error?.message || 'Facebook sign-in failed.  Please try again.';
      });
  }

  private handleSocialLogin(socialUser: SocialUser) {
    console.log('📤 Sending social user data to backend... ', socialUser);
    const rememberMe = this.loginForm.get('rememberMe')?.value || false;


    this.authService.socialLogin(socialUser,rememberMe).subscribe({
      next: (response: any) => {
         debugger;
        this.isSocialLoading = false;
        console.log('Backend response:', response);
    
         const token = response?.result?.token || response?.token;
        debugger;
        if (token) {
          console.log('User logged in successfully');
          this.inactivityService.initInactivityTimer();
          this.navigateAfterLogin();
        } else {
          this.errorMessage = 'No token received from server. ';
        }
      },
      error: (error: any) => {
        debugger;
      
        this.isSocialLoading = false;
            if(error?.status==401){
          localStorage.setItem('socialUser', JSON.stringify(socialUser));
          localStorage.setItem('Messagelg', error.error.result.message);
           this.router.navigate(['/register-company'], {
            queryParamsHandling: 'preserve'  
      });
        }
      const errorMsg = error?.error?.message || 
                        error?.error?.title || 
                        error.error.result.message ||
                        error?.message ||
                        'Social login failed. Please try regular login. ';
        
        this.errorMessage = errorMsg;
      }
    });
  }

  private navigateAfterLogin() {
    const navigationPath = this.returnUrl.startsWith('/') 
      ? this.returnUrl 
      : '/' + this.returnUrl;
    
    console.log('🚀 Navigating to:', navigationPath);
    this.router.navigate([navigationPath], { replaceUrl: true });
  }

  private handleError(error:  any) {
    if (error?.status === 401 || error?.status === 400) {
      this.errorMessage = 'Invalid username or password';
    } else if (error?.status === 403) {
      this.errorMessage = 'Access forbidden';
    } else if (error?.status === 0) {
      this.errorMessage = 'Unable to connect to server';
    } else {
      this.errorMessage = error?.error?.message || 'Login failed';
    }
    console.error('Login error:', error);
  }

  // Form control getters
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMeControl() {
    return this.loginForm.get('rememberMe');
  }
}