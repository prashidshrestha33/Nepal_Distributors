import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoriesService } from '../../../services/categories.service';

@Component({
  selector: 'app-categories-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditing ? 'Edit Category' : 'Add Category' }}</h1>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 rounded-lg shadow space-y-6">
        <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">{{ errorMessage }}</div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Name <span class="text-red-500">*</span></label>
          <input type="text" formControlName="name" placeholder="Enter category name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="name?.invalid && name?.touched">
          <p *ngIf="name?.invalid && name?.touched" class="mt-1 text-sm text-red-600">Name is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea formControlName="description" placeholder="Enter category description"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            [class.border-red-500]="description?.invalid && description?.touched"></textarea>
        </div>

        <div class="flex gap-4">
          <button type="submit" [disabled]="form.invalid || submitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" (click)="onCancel()" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>
        </div>
      </form>
    </div>
  `
})
export class CategoriesFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitting = false;
  errorMessage = '';
  isEditing = false;
  categoryId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.categoryId = Number(params['id']);
        this.loadCategory(this.categoryId);
      }
    });
  }

  loadCategory(id: number) {
    this.loading = true;
    this.categoriesService.getCategory(id).subscribe({
      next: (category) => {
        this.form.patchValue(category);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load category';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const data = this.form.value;
    const request = this.isEditing ? this.categoriesService.updateCategory(this.categoryId!, data) : this.categoriesService.createCategory(data);
    request.subscribe({
      next: () => this.router.navigate(['/admin/categories']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save category';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/categories']);
  }

  get name() { return this.form.get('name'); }
  get description() { return this.form.get('description'); }
}
