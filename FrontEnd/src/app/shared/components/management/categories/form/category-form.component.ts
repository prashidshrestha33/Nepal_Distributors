import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
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
  dropdownOpen = false;
  
  // All categories from API
  allCategories: Category[] = [];
  
  // Selected parent category
  selectedParentCategory: Category | null = null;

  // Track expanded sections (category IDs that are expanded)
  expandedCategories: Set<number> = new Set();

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      parent_id: [0, Validators.required] // Default to 0 (root), never null
    });
  }

  ngOnInit() {
    this.loadCategories();
    
    // Auto-generate slug from name with page prefix
    this.form.get('name')?.valueChanges.subscribe(name => {
      const slug = this.generateSlug(name);
      this.form.get('slug')?.setValue(slug, { emitEvent: false });
    });
  }

  /**
   * Load all categories from API
   */
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data: Category[]) => {
        console.log('✓ Categories loaded:', data);
        this.allCategories = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('✗ Error loading categories:', err);
        this.error = 'Failed to load categories';
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Generate slug from name with page prefix
   */
  generateSlug(name: string): string {
    const slugName = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    
    // Get the category path (hierarchy)
    if (this.selectedParentCategory) {
      const parentPath = this.getCategoryPath(this.selectedParentCategory.id);
      const fullPath = [...parentPath.map(c => c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')), slugName];
      return `categories/${fullPath.join('/')}`;
    }
    
    return `categories/${slugName}`;
  }

  /**
   * Get category path from root to specific category
   */
  getCategoryPath(categoryId: number | null): Category[] {
    if (!categoryId) return [];
    
    const path: Category[] = [];
    let currentCat = this.allCategories.find(c => c.id === categoryId);
    
    while (currentCat) {
      path.unshift(currentCat);
      if (currentCat.parent_id) {
        currentCat = this.allCategories.find(c => c.id === currentCat!.parent_id);
      } else {
        break;
      }
    }
    
    return path;
  }

  /**
   * Get all categories for the dropdown
   */
  getAllCategories(): Category[] {
    return this.allCategories;
  }

  /**
   * Get categories by specific depth level
   */
  getDepthCategories(depth: number): Category[] {
    return this.allCategories.filter(cat => cat.depth === depth);
  }

  /**
   * Get root categories (depth = 1 or parent_id = null)
   */
  getRootCategories(): Category[] {
    return this.getDepthCategories(1);
  }

  /**
   * Get children of a specific category (items with parent_id === categoryId)
   */
  getChildrenOfCategory(categoryId: number | null): Category[] {
    if (!categoryId) return [];
    return this.allCategories.filter(cat => cat.parent_id === categoryId);
  }

  /**
   * Check if a category has children
   */
  hasChildren(categoryId: number): boolean {
    return this.allCategories.some(cat => cat.parent_id === categoryId);
  }

  /**
   * Get selected category name for display
   */
  getSelectedCategoryName(): string {
    return this.selectedParentCategory?.name || '';
  }

  /**
   * Select a category
   */
  selectCategory(category: Category | null) {
    this.selectedParentCategory = category;
    
    if (category) {
      const parentIdValue = category.id;
      this.form.patchValue({ parent_id: parentIdValue });
      console.log('✓ Category selected:', category.name, 'ID:', parentIdValue);
    } else {
      this.form.patchValue({ parent_id: 0 });
      console.log('✓ No parent selected - parent_id set to 0');
    }
    
    // Regenerate slug based on new parent category
    const currentName = this.form.get('name')?.value;
    if (currentName) {
      const newSlug = this.generateSlug(currentName);
      this.form.get('slug')?.setValue(newSlug, { emitEvent: false });
    }
  }

  /**
   * Handle parent category selection from dropdown
   */
  onParentCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const categoryId = value ? parseInt(value, 10) : null;
    
    if (categoryId) {
      const cat = this.allCategories.find(c => c.id === categoryId);
      this.selectCategory(cat || null);
    } else {
      this.selectCategory(null);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      this.error = null;
      
      // Get all values
      const name = this.form.get('name')?.value;
      const slug = this.form.get('slug')?.value;
      const parentId = this.form.get('parent_id')?.value;
      
      console.log('=== FORM SUBMISSION ===');
      console.log('Name:', name);
      console.log('Slug:', slug);
      console.log('Parent ID from form:', parentId, '(Type:', typeof parentId, ')');
      
      // API expects parentId (camelCase), not parent_id
      const category: any = {
        name: name,
        slug: slug,
        parentId: parentId  // Changed from parent_id to parentId
      };

      console.log('✓ Sending to API:', category);

      this.categoryService.createCategory(category as Category).subscribe({
        next: () => {
          console.log('✓ Success! Redirecting...');
          this.router.navigate(['/management/categories']);
        },
        error: (err) => {
          console.error('✗ Error:', err);
          this.error = err?.error?.message || 'Failed to create category. Please try again.';
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

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  /**
   * Toggle category expansion
   */
  toggleCategoryExpansion(categoryId: number) {
    if (this.expandedCategories.has(categoryId)) {
      this.expandedCategories.delete(categoryId);
    } else {
      this.expandedCategories.add(categoryId);
    }
  }

  /**
   * Check if category is expanded
   */
  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategories.has(categoryId);
  }

  /**
   * Handle category click - toggle expand if has children, else select
   */
  handleCategoryClick(category: Category) {
    if (this.hasChildren(category.id)) {
      this.toggleCategoryExpansion(category.id);
    } else {
      this.selectCategory(category);
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdownElement = document.querySelector('.dropdown-container');
    
    if (dropdownElement && !dropdownElement.contains(target)) {
      this.dropdownOpen = false;
    }
  }
}