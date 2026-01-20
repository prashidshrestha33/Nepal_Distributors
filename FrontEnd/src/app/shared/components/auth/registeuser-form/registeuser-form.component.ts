// registeuser-form.component.ts
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
  selector: 'app-reg-user-form',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl:  './registeuser-form.component.html',
  styles: ``
})
export class RegisteUserFormComponent implements OnInit {
  showPassword = false;
  loginForm! : FormGroup;
  errorMessage = '';
  isLoading = false;
  isSocialLoading = false;
  returnUrl: string = '';
  constructor(
    private authService: AuthService,
    private socialAuthService: SocialAuthSimpleService,
    private router: Router,
    private route:  ActivatedRoute
  ) {
  }

  ngOnInit() {
    debugger;
   this.route.queryParams.subscribe(params => {
    debugger;
      const token = params['token'];
      if((token||token !=undefined)){
        this.returnUrl = token;
      }
      else  this.router.navigate(['/signin']); 
    });
  }

  signInWithGoogle() {
    // Prevent double-click
    if (this.isSocialLoading) {
      console.warn('⚠️ Social login already in progress');
      return;
    }
debugger;
    this.isSocialLoading = true;
    this. errorMessage = '';
    console. log('🔵 Initiating Google sign-in...');

    this.socialAuthService.signInWithGoogle()
      .then(user => {
        console. log('Google sign-in successful:', user);
        this.handleSocialLogin(user,'GOOGLE');  // Pass entire user object
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
        this.handleSocialLogin(user,'FACEBOOK');  // Pass entire user object
      })
      .catch(error => {
        this.isSocialLoading = false;
        console. error(' Facebook sign-in failed:', error);
        this.errorMessage = error?.message || 'Facebook sign-in failed.  Please try again.';
      });
  }

  private handleSocialLogin(socialUser: SocialUser,SignIn : string ) {
    console.log('📤 Sending social user data to backend... ', socialUser);
debugger;

    this.authService.socialLogin(socialUser,false).subscribe({
      next: (response: any) => {
        this.errorMessage = 'User with this Email already exist';
      },
      error: (error: any) => {
        this.isSocialLoading = false;
            if(error?.status==401){
       

          localStorage.setItem('socialUser', JSON.stringify(socialUser));
          localStorage.setItem('redirecturl', JSON.stringify(this.returnUrl));
           this.router.navigate(['/signup'], {
            queryParamsHandling: 'preserve'  
      });
        }
      }
    });
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
}