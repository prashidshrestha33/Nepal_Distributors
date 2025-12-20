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

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
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
      const category: Category = this.form.value;
      
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
