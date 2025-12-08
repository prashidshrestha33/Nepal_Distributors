import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SocialLoginService } from '../../services/social-login.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})
export class LoginComponent implements OnInit {

    loginForm!: FormGroup;
    loading = false;
    error: string | null = null;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private social: SocialLoginService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            remember: [false]   // ✅ Remember Me checkbox
        });
        // Preload Google SDK for faster response
        this.social.initGoogle(() => {}).then(() => {
            // Render the official Google button (if SDK available)
            try { this.social.renderGoogleButton('google-btn-container'); } catch (e) { /* ignore */ }
        }).catch(() => { /* ignore */ });
        // Init Facebook SDK and render a simple FB login button area if desired
        this.social.initFacebook().then(() => {
          try {
            const fbContainer = document.getElementById('facebook-btn-container');
            if (fbContainer) {
              fbContainer.innerHTML = '<button class="social-btn facebook" onclick="window.__fb_login && window.__fb_login()">\n                <i class="fa-brands fa-facebook-f"></i><span>Sign in with Facebook</span>\n              </button>';
              // expose helper to trigger FB login that calls Angular method
              (window as any).__fb_login = () => { this.signInWithFacebook(); };
            }
          } catch (e) { /* ignore */ }
        }).catch(() => { /* ignore */ });
    }

    // Shortcut getter
    get f() {
        return this.loginForm.controls;
    }

    onSubmit(): void {
        this.error = null;

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const { email, password, remember } = this.loginForm.value;

        this.auth.login(email, password).subscribe({
            next: (res: any) => {
                this.loading = false;

                // ✅ Store login token based on Remember me
                //    localStorage → stays after browser restart
                //    sessionStorage → removes on browser close
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('token', res.token);

                // Redirect to dashboard
                this.router.navigateByUrl('/dashboard');
            },

            error: (err) => {
                this.loading = false;
                this.error = 'Invalid email or password';
            }
        });
    }

    async signInWithGoogle(): Promise<void> {
        this.error = null;
        this.loading = true;
        try {
            const resp: any = await this.social.signInWithGoogle();
            // Expect backend to return token or session info
            if (resp?.token) {
                localStorage.setItem('token', resp.token);
            }
            this.router.navigateByUrl('/dashboard');
        } catch (e: any) {
            this.error = e?.message || 'Google sign-in failed';
        } finally {
            this.loading = false;
        }
    }

    async signInWithFacebook(): Promise<void> {
        this.error = null;
        this.loading = true;
        try {
            await this.social.initFacebook();
            window.FB.login(async (resp: any) => {
                if (resp.status === 'connected' && resp.authResponse) {
                    try {
                        // Exchange FB access token with backend which saves app token
                        await firstValueFrom(this.auth.facebookLogin(resp.authResponse.accessToken));
                        this.router.navigateByUrl('/dashboard');
                    } catch (err: any) {
                        this.error = err?.message || 'Facebook sign-in failed';
                    } finally {
                        this.loading = false;
                    }
                } else {
                    this.loading = false;
                    this.error = 'Facebook login cancelled or failed';
                }
            }, { scope: 'email' });
        } catch (err: any) {
            this.loading = false;
            this.error = err?.message || 'Facebook sign-in failed';
        }
    }
}
