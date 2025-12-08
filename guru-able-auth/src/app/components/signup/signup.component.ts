import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css'],
    standalone: false
})
export class SignupComponent implements OnInit {

    // Form definition with all validations
    form = this.fb.group({
        fullName: ['', [
            Validators.required,
            Validators.pattern(/^[a-zA-Z\s]+$/) // letters and spaces only
        ]],
        email: ['', [
            Validators.required,
            Validators.email
        ]],
        phone: ['', [
            Validators.required,
            Validators.pattern(/^\+977 \d{10}$/) // +977 followed by exactly 10 digits
        ]],
        password: ['', [
            Validators.required,
            Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
            // at least 8 characters, 1 uppercase, 1 special char
        ]]
    });

    loading = false;
    error: string | null = null;

    constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) { }

    ngOnInit() {
        // Prefill phone input with '+977 '
        this.form.patchValue({ phone: '+977 ' });
    }

    /**
     * Ensure phone always starts with '+977 ' and only allows 10 digits after it
     */
    onPhoneInput(event: any) {
        let input = this.form.get('phone')?.value || '+977 ';

        // Ensure it starts with '+977 '
        if (!input.startsWith('+977 ')) input = '+977 ';

        // Remove all non-digit characters after '+977 '
        const digits = input.slice(5).replace(/\D/g, '');

        // Limit to 10 digits
        const limited = digits.slice(0, 11);

        // Set final value
        const finalValue = '+977 ' + limited;
        this.form.get('phone')?.setValue(finalValue, { emitEvent: false });
    }

    /**
     * Submit the registration form
     */
    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched(); // highlight all errors
            return;
        }

        this.loading = true;
        this.error = null;

        const payload = {
            user: {
                fullName: this.form.value.fullName,
                email: this.form.value.email,
                password: this.form.value.password,
                phoneNumber: this.form.value.phone
            }
            // company: optional, can be added here if needed
        };

        this.auth.register(payload).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/login']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.error || 'Registration failed';
            }
        });
    }

    // --- Helper getters for template binding ---
    get fullName() { return this.form.get('fullName'); }
    get email() { return this.form.get('email'); }
    get phone() { return this.form.get('phone'); }
    get password() { return this.form.get('password'); }
}
