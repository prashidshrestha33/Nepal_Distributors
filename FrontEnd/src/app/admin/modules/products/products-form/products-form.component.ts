import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import { CategoriesService, Category } from '../../../services/categories.service';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditing ? 'Edit Product' : 'Add Product' }}</h1>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 rounded-lg shadow space-y-6">
        <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">{{ errorMessage }}</div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Name <span class="text-red-500">*</span></label>
          <input type="text" formControlName="name" placeholder="Enter product name"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="name?.invalid && name?.touched">
          <p *ngIf="name?.invalid && name?.touched" class="mt-1 text-sm text-red-600">Name is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Category <span class="text-red-500">*</span></label>
          <select formControlName="categoryId"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="categoryId?.invalid && categoryId?.touched">
            <option value="">Select a category</option>
            <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
          </select>
          <p *ngIf="categoryId?.invalid && categoryId?.touched" class="mt-1 text-sm text-red-600">Category is required</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Price <span class="text-red-500">*</span></label>
            <input type="number" formControlName="price" placeholder="0.00" step="0.01"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="price?.invalid && price?.touched">
            <p *ngIf="price?.invalid && price?.touched" class="mt-1 text-sm text-red-600">Valid price is required</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantity <span class="text-red-500">*</span></label>
            <input type="number" formControlName="quantity" placeholder="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="quantity?.invalid && quantity?.touched">
            <p *ngIf="quantity?.invalid && quantity?.touched" class="mt-1 text-sm text-red-600">Quantity is required</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea formControlName="description" placeholder="Enter product description"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"></textarea>
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
export class ProductsFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitting = false;
  errorMessage = '';
  isEditing = false;
  productId: number | null = null;
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      quantity: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.productId = Number(params['id']);
        this.loadProduct(this.productId);
      }
    });
  }

  loadCategories() {
    this.categoriesService.getCategories({ pageSize: 100 }).subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => console.error('Failed to load categories', error)
    });
  }

  loadProduct(id: number) {
    this.loading = true;
    this.productsService.getProduct(id).subscribe({
      next: (product) => {
        this.form.patchValue(product);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load product';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const data = this.form.value;
    const request = this.isEditing ? this.productsService.updateProduct(this.productId!, data) : this.productsService.createProduct(data);
    request.subscribe({
      next: () => this.router.navigate(['/admin/products']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save product';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/products']);
  }

  get name() { return this.form.get('name'); }
  get categoryId() { return this.form.get('categoryId'); }
  get price() { return this.form.get('price'); }
  get quantity() { return this.form.get('quantity'); }
}
