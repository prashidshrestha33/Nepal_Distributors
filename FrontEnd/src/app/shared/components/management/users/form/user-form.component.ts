import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../services/management/user.service';
import type { User } from '../../../../services/management/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      phone: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit() {}

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const user: User = this.form.value;
      
      this.userService.createUser(user).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (err) => {
          this.error = 'Failed to create user. Please try again.';
          console.error('Error creating user:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
