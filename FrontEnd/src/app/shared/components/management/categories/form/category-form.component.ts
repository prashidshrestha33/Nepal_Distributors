import { Component, OnInit, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
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
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  allCategories: Category[] = [];
  selectedCategoryId: number | null = null;
  dropdownOpen = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private el: ElementRef
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      parent_id: [null]  // Only one parent category can be selected
    });
  }

  ngOnInit() {
    this.loadCategories();

    // Auto-generate slug from name
    this.form.get('name')?.valueChanges.subscribe(name => {
      const slug = this.generateSlug(name);
      this.form.get('slug')?.setValue(slug, { emitEvent: false });
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data: Category[]) => {
        this.allCategories = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.error = 'Failed to load categories';
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  generateSlug(name: string): string {
    const slugName = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `categories/${slugName}`;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectCategory(category: Category) {
    this.selectedCategoryId = category.id;
    this.form.get('parent_id')?.setValue(category.id);  // Set the selected category ID
    this.dropdownOpen = false;  // Close the dropdown
  }

  getSelectedCategoryName(): string {
    const selectedCategory = this.allCategories.find(cat => cat.id === this.selectedCategoryId);
    return selectedCategory ? selectedCategory.name : '';
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      this.error = null;

      // Payload to send to API
      const payload = {
        name: this.form.value.name,
        slug: this.form.value.slug,
        parentId: this.form.value.parent_id  // Single parent category ID
      };

      // Call createCategory with proper typing
      this.categoryService.createCategory(payload as any).subscribe({
        next: () => this.router.navigate(['/management/categories']),
        error: (err) => {
          console.error(err);
          this.error = err?.error?.message || 'Failed to create category';
          this.loading = false;
        }
      });
    } else {
      console.error('Form is invalid');
    }
  }

  goBack() {
    this.router.navigate(['/management/categories']);
  }
}
