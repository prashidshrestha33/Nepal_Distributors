import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            remember: [false]   // ✅ Remember Me checkbox
        });
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

    signInWithGoogle(): void {
        this.error = null;
        this.loading = true;

        this.auth.signInWithProvider('google').subscribe({
            next: () => {
                this.loading = false;
                this.router.navigateByUrl('/dashboard');
            },
            error: (e) => {
                this.loading = false;
                this.error = e?.message || 'Google sign-in failed';
            }
        });
    }

    signInWithFacebook(): void {
        this.error = null;
        this.loading = true;

        this.auth.signInWithProvider('facebook').subscribe({
            next: () => {
                this.loading = false;
                this.router.navigateByUrl('/');
            },
            error: (e) => {
                this.loading = false;
                this.error = e?.message || 'Facebook sign-in failed';
            }
        });
    }
}
