import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsersService, User } from '../../../services/users.service';

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditing ? 'Edit User' : 'Add User' }}</h1>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading user...</p>
      </div>

      <!-- Form -->
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 rounded-lg shadow space-y-6">
        <!-- Error Message -->
        <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">
          {{ errorMessage }}
        </div>

        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            First Name <span class="text-red-500">*</span>
          </label>
          <input type="text" formControlName="firstName" placeholder="Enter first name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="firstName?.invalid && firstName?.touched">
          <p *ngIf="firstName?.invalid && firstName?.touched" class="mt-1 text-sm text-red-600">
            First name is required
          </p>
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span class="text-red-500">*</span>
          </label>
          <input type="text" formControlName="lastName" placeholder="Enter last name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="lastName?.invalid && lastName?.touched">
          <p *ngIf="lastName?.invalid && lastName?.touched" class="mt-1 text-sm text-red-600">
            Last name is required
          </p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Email <span class="text-red-500">*</span>
          </label>
          <input type="email" formControlName="email" placeholder="Enter email"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="email?.invalid && email?.touched">
          <p *ngIf="email?.invalid && email?.touched" class="mt-1 text-sm text-red-600">
            Valid email is required
          </p>
        </div>

        <!-- Phone Number -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span class="text-red-500">*</span>
          </label>
          <input type="tel" formControlName="phoneNo" placeholder="Enter phone number"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="phoneNo?.invalid && phoneNo?.touched">
          <p *ngIf="phoneNo?.invalid && phoneNo?.touched" class="mt-1 text-sm text-red-600">
            Phone number is required
          </p>
        </div>

        <!-- Role -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Role <span class="text-red-500">*</span>
          </label>
          <select formControlName="role"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="role?.invalid && role?.touched">
            <option value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
          <p *ngIf="role?.invalid && role?.touched" class="mt-1 text-sm text-red-600">
            Role is required
          </p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-4">
          <button type="submit" [disabled]="form.invalid || submitting"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" (click)="onCancel()"
            class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `
})
export class UsersFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitting = false;
  errorMessage = '';
  isEditing = false;
  userId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNo: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.userId = Number(params['id']);
        this.loadUser(this.userId);
      }
    });
  }

  loadUser(id: number) {
    this.loading = true;
    this.usersService.getUser(id).subscribe({
      next: (user) => {
        this.form.patchValue(user);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load user';
        this.loading = false;
        console.error(error);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    const data = this.form.value;

    const request = this.isEditing
      ? this.usersService.updateUser(this.userId!, data)
      : this.usersService.createUser(data);

    request.subscribe({
      next: () => {
        this.router.navigate(['/admin/users']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save user';
        this.submitting = false;
        console.error(error);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/users']);
  }

  get firstName() { return this.form.get('firstName'); }
  get lastName() { return this.form.get('lastName'); }
  get email() { return this.form.get('email'); }
  get phoneNo() { return this.form.get('phoneNo'); }
  get role() { return this.form.get('role'); }
}
