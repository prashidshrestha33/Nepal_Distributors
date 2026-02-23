import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { CompanyService } from '../../../../services/management/company.service';
import { CategoryService } from '../../../../services/management/management.service';
import type { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {

  form!: FormGroup;
  loading = false;
  error: string | null = null;

  categories: Category[] = [];
  allCategories: Category[] = [];
  nestedCategories: any[] = [];   // flattened tree for display
  selectedCategoryIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private CompanyService: CompanyService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      parent_id: [null]   // single parent
    });
  }

  ngOnInit() {
    this.loadCategories();

    // auto slug
    this.form.get('name')?.valueChanges.subscribe(name => {
      const slug = this.generateSlug(name);
      this.form.get('slug')?.setValue(slug, { emitEvent: false });
    });
  }

  // ===============================
  // Load + Flatten category tree
  // ===============================
loadCategories() {
  this.loading = true;
  this.CompanyService.getCategories().subscribe({
    next: (res: any) => { // API wrapper
      debugger;
      this.categories = res || [];

      // Flatten for ng-select
      this.nestedCategories = this.flattenCategories(this.categories);

      this.loading = false;
      console.log('Nested Categories:', this.nestedCategories);
    },
    error: (err) => {
      console.error('Failed to load categories:', err);
      this.error = 'Failed to load categories. Please try again.';
      this.loading = false;
    }
  });
}
flattenCategories(categories: Category[], depth = 0): Category[] {
  const result: Category[] = [];

  for (const cat of categories) {
    result.push({ ...cat, depth });
    if (cat.children && cat.children.length > 0) {
      result.push(...this.flattenCategories(cat.children, depth + 1));
    }
  }

  return result;
}

  // ===============================
  // Helpers
  // ===============================
  generateSlug(name: string): string {
    return `categories/${name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '')}`;
  }

  isFieldInvalid(field: string) {
    const f = this.form.get(field);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  // ===============================
  // Submit
  // ===============================
  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;

    const payload = {
      name: this.form.value.name,
      slug: this.form.value.slug,
      parentId: this.form.value.parent_id
    };

    this.categoryService.createCategory(payload as any).subscribe({
      next: () => this.router.navigate(['/management/categories']),
      error: (err) => {
        this.error = err?.error?.message || 'Failed to create category';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/management/categories']);
  }
}
