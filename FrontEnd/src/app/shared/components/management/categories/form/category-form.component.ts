import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { CompanyService } from '../../../../services/management/company.service';
import { CategoryService } from '../../../../services/management/management.service';
import { FormsModule } from '@angular/forms';

import { CatagoryDynamicComponent } from '../../../../components/CustomComponents/CatagoryDynamic/catagory-dynamic.component'; 
interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
  children?: Category[];
  depth?: number;
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, CatagoryDynamicComponent],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  allCategories: Category[] = [];
  flatCategories: Category[] = [];

  levelCategories: Category[][] = [];
  selectedParents: (number | null)[] = [null];

  imageUrl: string | null = null;
  selectedImage: File | null = null;

  isDragging = false;
  maxVisibleLevels = 5; // feel free to increase

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private companyService: CompanyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      slug: ['', Validators.required],
      parent_id: [null],
      image: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.setupNameToSlugListener();
  }

  private setupNameToSlugListener(): void {
    this.form.get('name')?.valueChanges.subscribe(name => {
      if (name?.trim()) {
        const slug = this.generateSlug(name);
        this.form.get('slug')?.setValue(slug, { emitEvent: false });
      } else {
        this.form.get('slug')?.setValue('', { emitEvent: false });
      }
    });
  }
    onCategoryChosen(categoryId: any): void {
      if (typeof categoryId === 'number') {
        this.form.get('parent_id')?.setValue(categoryId);
      } else {
        console.error('Invalid category ID:', categoryId);
      }
  }

private flattenCategories(categories: Category[], depth = 0): Category[] {
  let result: Category[] = [];
  for (const cat of categories) {
    result.push({ ...cat, depth });
    if (cat.children?.length) {
      result.push(...this.flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}

private initializeCascadingLevels(): void {
    this.levelCategories = [];
    this.levelCategories[0] = this.allCategories.filter(c => c.parent_id === null);

    // Initialize empty arrays for deeper levels
    for (let i = 1; i < this.maxVisibleLevels; i++) {
      this.levelCategories[i] = [];
    }

    this.selectedParents = [null];
  }

  onParentChange(level: number, selectedId: number | null): void {
    // Keep only selections up to current level
    this.selectedParents = this.selectedParents.slice(0, level + 1);
    this.selectedParents[level] = selectedId;

    // Reset parent_id — will be set to deepest valid selection
    this.form.get('parent_id')?.setValue(null);

    if (selectedId) {
      const selectedCat = this.findCategoryById(selectedId);
      if (selectedCat?.children?.length) {
        this.levelCategories[level + 1] = selectedCat.children;
        this.selectedParents[level + 1] = null;
      } else {
        this.levelCategories[level + 1] = [];
      }

      // Set deepest selected category as parent_id
      this.form.get('parent_id')?.setValue(selectedId);
    }

    // Clear all deeper levels
    for (let i = level + 2; i < this.maxVisibleLevels; i++) {
      this.levelCategories[i] = [];
      this.selectedParents[i] = null;
    }

    this.cdr.detectChanges();
  }

  showLevel(level: number): boolean {
    if (level === 0) return true;
    if (!this.selectedParents[level - 1]) return false;
    // Also show only if there are actual items to choose from
    return this.levelCategories[level]?.length > 0;
  }

  private findCategoryById(id: number): Category | undefined {
    return this.flatCategories.find(c => c.id === id);
  }

  generateSlug(name: string): string {
    return `categories/${name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}`;
  }

  // ────────────────────────────────────────────────
  //               Image Handling
  // ────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.error = 'Only image files are allowed (PNG, JPG, JPEG, WEBP)';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Image size must be less than 5MB';
      return;
    }

    this.error = null;
    this.selectedImage = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imageUrl = reader.result as string;
      this.form.patchValue({ image: file });
      this.form.get('image')?.markAsTouched();
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    this.selectedImage = null;
    this.imageUrl = null;
    this.form.patchValue({ image: null });
    this.form.get('image')?.markAsTouched();
    this.error = null;
    this.cdr.detectChanges();
  }

  // ────────────────────────────────────────────────
  //                   Form Submit
  // ────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formData = new FormData();
    formData.append('name', (this.form.value.name || '').trim());
    formData.append('slug', (this.form.value.slug || '').trim());

    const parentId = this.form.value.parent_id;
    if (parentId) {
      formData.append('parentId', parentId.toString());
    }

    if (this.selectedImage) {
      formData.append('image', this.selectedImage);
    }

    this.categoryService.createCategory(formData).subscribe({
      next: () => {
        this.router.navigate(['/management/categories']);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to create category. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/management/categories']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get currentParentName(): string {
    const lastSelectedId = [...this.selectedParents].reverse().find(id => id !== null);
    return lastSelectedId ? this.findCategoryById(lastSelectedId)?.name || '' : '';
  }

  private loadCategories(): void {
    this.categoryService.getTreeCategories().subscribe({
      next: (categories: Category[]) => {
        this.allCategories = categories;
        this.flatCategories = this.flattenCategories(categories);
        this.initializeCascadingLevels();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories. Please try again later.';
      }
    });
  }
}