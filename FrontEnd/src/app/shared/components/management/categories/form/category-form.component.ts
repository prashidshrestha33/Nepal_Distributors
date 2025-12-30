import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css'
})
export class CategoryFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  parentCategories: Category[] = [];
  loadingCategories = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      parentId: [0]
    });
  }

  ngOnInit() {
    this.loadParentCategories();
    
    // Auto-generate slug from name
    this.form.get('name')?.valueChanges.subscribe(name => {
      const slug = this.generateSlug(name);
      this.form.get('slug')?.setValue(slug, { emitEvent: false });
    });
  }

  /**
   * Generate slug from name (convert to lowercase, replace spaces with hyphens)
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  /**
   * Load parent categories from API
   */
  loadParentCategories() {
    this.loadingCategories = true;
    this.categoryService.getParentCategories().subscribe({
      next: (categories) => {
        this.parentCategories = categories;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Error loading parent categories:', err);
        this.loadingCategories = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const category: Category = this.form.value;
      
      // If no parent selected, set parentId to 0 (make it a parent category)
      if (!category.parentId) {
        category.parentId = 0;
      }

      this.categoryService.createCategory(category).subscribe({
        next: () => {
          this.router.navigate(['/categories']);
        },
        error: (err) => {
          this.error = 'Failed to create category. Please try again.';
          console.error('Error creating category:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/categories']);
  }
}

