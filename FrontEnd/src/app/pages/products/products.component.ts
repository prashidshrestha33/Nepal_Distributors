import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService, Category } from '../../shared/services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  categoryForm!: FormGroup;
  loading = false;
  isEditMode = false;
  editingId: number | null = null;
  showForm = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.productService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.categories = response?.result || response || [];
          this.loading = false;
          this.clearMessages();
        },
        error: (error: any) => {
          this.loading = false;
          this.errorMessage = 'Failed to load categories';
          console.error('Load error:', error);
        }
      });
  }

  openForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.editingId = null;
    this.categoryForm.reset({ isActive: true });
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.categoryForm.reset();
    this.clearMessages();
  }

  editCategory(category: Category): void {
    this.isEditMode = true;
    this.editingId = category.id || null;
    this.categoryForm.patchValue(category);
    this.showForm = true;
    this.clearMessages();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    const formValue = this.categoryForm.value;
    this.loading = true;

    if (this.isEditMode && this.editingId) {
      this.productService.updateCategory(this.editingId, formValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.successMessage = 'Category updated successfully';
            this.loadCategories();
            this.closeForm();
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = error?.error?.message || 'Failed to update category';
            console.error('Update error:', error);
          }
        });
    } else {
      this.productService.addCategory(formValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.successMessage = 'Category created successfully';
            this.loadCategories();
            this.closeForm();
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = error?.error?.message || 'Failed to create category';
            console.error('Create error:', error);
          }
        });
    }
  }

  deleteCategory(id: number | undefined): void {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    this.loading = true;
    this.productService.deleteCategory(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Category deleted successfully';
          this.loadCategories();
        },
        error: (error: any) => {
          this.loading = false;
          this.errorMessage = error?.error?.message || 'Failed to delete category';
          console.error('Delete error:', error);
        }
      });
  }

  getFilteredCategories(): Category[] {
    if (!this.searchTerm) {
      return this.categories;
    }
    return this.categories.filter(cat =>
      cat.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  clearMessages(): void {
    setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
    }, 3000);
  }

  get name() {
    return this.categoryForm.get('name');
  }

  get description() {
    return this.categoryForm.get('description');
  }
}
