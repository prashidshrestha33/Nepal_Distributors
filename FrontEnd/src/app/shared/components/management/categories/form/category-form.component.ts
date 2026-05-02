import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { environment } from '../../../../../../environments/environment';
import { CompanyService } from '../../../../services/management/company.service';
import { Category, CategoryService } from '../../../../services/management/management.service';
import { FormsModule } from '@angular/forms';

import { CatagoryDynamicComponent } from '../../../../components/CustomComponents/CatagoryDynamic/catagory-dynamic.component'; 


@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, CatagoryDynamicComponent],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {
  @Input() isModal: boolean = false;
  @Input() categoryId: number | undefined;
  @Output() closeModal = new EventEmitter<void>();
  @Output() categorySaved = new EventEmitter<void>();

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
  isEditMode = false;
  initialParentId: number | null = null;
  snackbar: { show: boolean; message: string; type: 'success' | 'error' | 'warning' } = { show: false, message: '', type: 'success' };

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute,   // ✅ FIXED
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      slug: ['', Validators.required],
      parent_id: [null],
      image: [null],
      activeFlag: [true]
    });
  }

  ngOnInit() {
    // Check if editing (either from modal input or route param)
    let id: string | number | null = null;
    
    if (this.isModal && this.categoryId) {
      // Modal mode: use Input categoryId
      id = this.categoryId;
    } else if (!this.isModal) {
      // Page mode: use route parameter
      id = this.route.snapshot.paramMap.get('id');
    }
    
    if (id) {
      console.log('Editing category ID:', id);
      this.isEditMode = true;
      this.loadCategoryById();
    }
    
    this.setupNameToSlugListener();
  }

// ✅ LOAD CATEGORY FOR EDIT
  private loadCategoryById(): void {
    this.loading = true;

    this.categoryService.getCategoryById(this.categoryId!).subscribe({
      next: (res: any) => {
        // The endpoint returns the category directly (no ApiResponse wrapper)
        const data = res?.result ?? res;

        this.form.patchValue({
          name: data.name,
          slug: data.slug,
          parent_id: data.parentId,
          activeFlag: data.activeFlag ?? true
        });
        this.initialParentId = data.parentId;

        if (data.image) {
          this.imageUrl = `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(data.image)}`;
        }
        
        if (data.parentId) {
          this.categoryService.getCategoryById(data.parentId).subscribe({
            next: (pRes: any) => {
              const pData = pRes?.result ?? pRes;
              this.parentSlugBase = pData?.slug || '';
            }
          });
        } else {
          this.parentSlugBase = '';
        }

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load category';
        this.loading = false;
      }
    });
  }

  parentSlugBase = '';

  private setupNameToSlugListener(): void {
    this.form.get('name')?.valueChanges.subscribe(() => {
      this.updateSlug();
    });
  }

  private updateSlug(): void {
    const name = this.form.get('name')?.value;
    if (name?.trim()) {
      const nameSegment = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const finalSlug = this.parentSlugBase 
        ? `${this.parentSlugBase}-${nameSegment}` 
        : nameSegment;
      this.form.get('slug')?.setValue(finalSlug, { emitEvent: false });
    } else {
      this.form.get('slug')?.setValue('', { emitEvent: false });
    }
  }

  onCategoryPathChosen(slugPath: string): void {
    this.parentSlugBase = slugPath;
    this.updateSlug();
  }

  onCategoryChosen(categoryId: any): void {
    if (typeof categoryId === 'number' && categoryId > 0) {
      this.form.get('parent_id')?.setValue(categoryId);

      // 🔹 Check parent status: if parent is inactive, child should be inactive default
      this.categoryService.getCategoryById(categoryId).subscribe({
        next: (res: any) => {
          const parent = res?.result ?? res;
          if (parent && parent.activeFlag === false) {
            this.form.get('activeFlag')?.setValue(false);
            this.showSnackbar('Parent category is inactive. This category will also be set to inactive.', 'warning');
          }
        }
      });
    } else {
      this.form.get('parent_id')?.setValue(null);
      this.parentSlugBase = '';
      this.updateSlug();
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
    this.levelCategories[0] = this.allCategories.filter(c => c.parentId === null);

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

  // Update form control
  this.form.patchValue({
    image: file
  });

  this.form.get('image')?.updateValueAndValidity();

  // Preview image
  const reader = new FileReader();
  reader.onload = () => {
    this.imageUrl = reader.result as string;
    this.cdr.detectChanges();
  };
  reader.readAsDataURL(file);
}

  removeImage(event: Event): void {
  event.stopPropagation();
  event.preventDefault();

  this.selectedImage = null;
  this.imageUrl = null;

  this.form.patchValue({
    image: null
  });

  this.form.get('image')?.markAsTouched();
}

  // ────────────────────────────────────────────────
  //                   Form Submit
  // ────────────────────────────────────────────────

// onSubmit(): void {
//   if (this.form.invalid) {
//     this.form.markAllAsTouched();
//     return;
//   }

//   const formData = new FormData();
//   formData.append('Name', this.form.value.name);       
//   formData.append('Slug', this.form.value.slug);       
//   if (this.form.value.parent_id) {
//     formData.append('ParentId', this.form.value.parent_id || ''); 
//   }
//   if (this.selectedImage) {
//     formData.append('Image', this.selectedImage);     
//   }

//   this.categoryService.createCategory(formData).subscribe({
//     next: () => this.router.navigate(['/management/categories']),
//     error: (err) => console.error('Error', err)
//   });
// }
onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const formData = new FormData();
  formData.append('Name', this.form.value.name);
  formData.append('Slug', this.form.value.slug);
  if (this.form.value.parent_id) {
    formData.append('ParentId', this.form.value.parent_id || '');
  }
  if (this.selectedImage) {
    formData.append('Image', this.selectedImage);
  }
  formData.append('ActiveFlag', this.form.value.activeFlag ? 'true' : 'false');

  if (this.isEditMode) {
      this.categoryService.updateCategory(this.categoryId!, formData).subscribe({
        next: () => {
          if (this.isModal) {
            this.categorySaved.emit();
          } else {
            this.router.navigate(['/management/categories'], { 
              state: { snackbar: { message: 'Category updated successfully!', success: true } } 
            });
          }
        },
        error: (err) => {
          console.error('Error', err);
          this.showSnackbar('Failed to update category. Please try again.', 'error');
        }
      });
    } else {
      this.categoryService.createCategory(formData).subscribe({
        next: () => {
          if (this.isModal) {
            this.categorySaved.emit();
          } else {
            this.router.navigate(['/management/categories'], { 
              state: { snackbar: { message: 'Category created successfully!', success: true } } 
            });
          }
        },
        error: (err) => {
          console.error('Error', err);
          this.showSnackbar('Failed to create category. Please try again.', 'error');
        }
      });
    }
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 5000) {
    this.snackbar = { show: true, message, type };
    setTimeout(() => {
      this.snackbar.show = false;
      this.cdr.detectChanges();
    }, duration);
    this.cdr.detectChanges();
  }

  goBack(): void {
    if (this.isModal) {
      this.closeModal.emit();
    } else {
      this.router.navigate(['/management/categories']);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get currentParentName(): string {
    const lastSelectedId = [...this.selectedParents].reverse().find(id => id !== null);
    return lastSelectedId && lastSelectedId !== null ? this.findCategoryById(lastSelectedId)?.name || '' : '';
  }

  // private loadCategories(): void {
  //   this.categoryService.getTreeCategories().subscribe({
  //     next: (categories: Category[]) => {
  //       this.allCategories = categories;
  //       this.flatCategories = this.flattenCategories(categories);
  //       this.initializeCascadingLevels();
  //     },
  //     error: (err) => {
  //       console.error('Error loading categories:', err);
  //       this.error = 'Failed to load categories. Please try again later.';
  //     }
  //   });
  // }
}