import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Product, ProductService, StaticValueCatalog } from '../../../../services/management/management.service';
import { StaticValue } from '../../../../services/management/management.service';
import { StaticValueService } from '../../../../services/management/management.service';
import { CategoryService } from '../../../../services/management/management.service';
import { Category } from '../../../../services/management/management.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {

  snackbar = {
    show: false,
    message: '',
    success: true
  };

  private showSnackbar(message: string, success: boolean = true) {
    this.snackbar.message = message;
    this.snackbar.success = success;
    this.snackbar.show = true;
    setTimeout(() => {
      this.snackbar.show = false;
    }, 5000);
  }

  @Input() editMode: boolean = false;
  @Input() productId?: number;

  items: StaticValue[] = [];
  filteredItems: StaticValue[] = [];
  searchTerm = '';
  catalogId: number | null = null;
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  staticItem: StaticValueCatalog[] = [];
  staticFilteredItems: StaticValueCatalog[] = [];

  // Files
  productImage?: File;
  treeCategories: Category[] = [];
  flatCategories: Category[] = [];
  cascadingDropdowns: Category[][] = [];
  dropdownLabels: string[] = [];
  loadingStates: boolean[] = [];
  selectedAtLevel: (number | null)[] = [];
  imagePreview: string | ArrayBuffer | null = null;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private http: HttpClient,
    private service: StaticValueService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      sku: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      shortDescription: [''],
      categoryId: ['', Validators.required],
      subCategoryId: [0],
      subSubCategoryId: [0],
      brandId: ['', Validators.required],
      manufacturerId: [0, Validators.required],
      rate: [0, [Validators.required, Validators.min(0)]],
      hsCode: [''],
      status: [null],
      isFeatured: [true],
      seoTitle: [''],
      seoDescription: [''],
      attributes: [''],
      createdBy: [''],
      productImage: [''],
    });
  }

  ngOnInit(): void {
    this.getAllCatalog();
    this.loadCategoryTree();
    if (this.editMode && this.productId) {
      this.loadProductForEdit(this.productId);
    }
  }

  loadProductForEdit(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product: Product) => {
        this.form.patchValue(product);
        // If product has imageUrl, set preview
        if (product.imageUrl) {
          this.imagePreview = product.imageUrl;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load product.';
        this.loading = false;
      }
    });
  }

  // Category Functions
  showCategoryMenu = false;
  
  getCategoryName(id: number): string | null {
    const findCat = (cats: Category[]): string | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat.name;
        if (cat.children) {
          const found = findCat(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCat(this.treeCategories);
  }

  selectCategory(cat: Category) {
    this.form.get('categoryId')?.setValue(cat.id);
    this.showCategoryMenu = false;
  }

  getChildNames(cat: Category): string {
    if (!cat || !cat.id) return '';
    const found = this.treeCategories.find(c => c.id === cat.id);
    if (!found || !found.children || found.children.length === 0) return '';
    return found.children.map(child => child.name).join(', ');
  }

  // Brand Functions
  showBrandMenu = false;

  getBrandName(id: number): string | null {
    const brand = this.filteredItems.find(b => b.staticId === id);
    return brand ? brand.staticValueKey : null;
  }

  selectBrand(brand: any) {
    this.form.get('brandId')?.setValue(brand.staticId);
    this.showBrandMenu = false;
  }

  // SKU Generation
  private updateSku() {
    const categoryId = this.form.get('categoryId')?.value;
    const name = this.form.get('name')?.value || '';
    const selectedCategory = this.staticFilteredItems.find(cat => cat.catalogId === categoryId);
    if (selectedCategory && name) {
      const sku = `${selectedCategory.catalogName}-${name}-${Math.floor(1000 + Math.random() * 9000)}`;
      this.form.get('sku')?.setValue(sku, { emitEvent: false });
    }
  }

  // Clear Functions
  clearCategory() {
    this.form.get('categoryId')?.setValue(null);
    this.showCategoryMenu = false;
  }

  clearBrand() {
    this.form.get('brandId')?.setValue(null);
    this.showBrandMenu = false;
  }

  // Static Values
  loadStaticValue(): void {
    if (!this.catalogId) {
      this.error = 'Invalid catalog ID';
      return;
    }
    this.loading = true;
    this.error = null;

    this.service.getStaticValues(this.catalogId).subscribe({
      next: (data: StaticValue[]) => {
        this.items = data;
        this.filteredItems = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.items = [];
        this.filteredItems = [];
      }
    });
  }

  loadCategoryTree() {
    this.categoryService.getTreeCategories().subscribe({
      next: (tree: Category[]) => {
        this.treeCategories = tree;
        this.flatCategories = this.flattenCategories(tree);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Move form - Error loading category tree:', err);
        this.cdr.markForCheck();
      }
    });
  }

  // Recursively flatten categories for dropdown
  flattenCategories(categories: Category[], depth: number = 1): Category[] {
    let result: Category[] = [];
    for (const cat of categories) {
      result.push({ ...cat, depth });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(this.flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  }

  // Load Catalog
  getAllCatalog(): void {
    this.loading = true;
    this.error = null;

    this.service.getStaticValuesCatagory().subscribe({
      next: (data: StaticValueCatalog[]) => {
        this.staticItem = data;
        this.staticFilteredItems = data;

        // Find catalog with name 'Brand'
        const brandCatalog = data.find(
          (catalog) => catalog.catalogName === 'Brand'
        );

        if (brandCatalog) {
          this.catalogId = brandCatalog.catalogId;
          this.loadStaticValue();
        } else {
          this.error = 'Brand catalog not found';
        }

        this.loading = false;

        // Call updateSku after staticFilteredItems is set
        this.updateSku();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load catalog list';
      }
    });
  }

// File Handlers
onProductImageChange(event: any) {
  const file =
    event.target.files && event.target.files.length > 0
      ? event.target.files[0]
      : undefined;

  if (!file) {
    return;
  }

  // Validate image
  if (!file.type.startsWith('image/')) {
    alert('Only image files are allowed');
    return;
  }

  this.productImage = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = () => {
    this.imagePreview = reader.result;
  };
  reader.readAsDataURL(file);
}
removeImage() {
  this.productImage = undefined;
  this.imagePreview = null;

  // Clear file input (removes filename)
  if (this.fileInput?.nativeElement) {
    this.fileInput.nativeElement.value = '';
  }

  // Reset form control for productImage
  this.form.get('productImage')?.setValue(null);
}


  // Submit Form
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Auto-generate SKU as SUK-categoryname-productname
    const categoryName = this.getCategoryName(this.form.value.categoryId) || '';
    const productName = this.form.value.name || '';
    const sku = `SUK-${categoryName}-${productName}`.replace(/\s+/g, '').toLowerCase();

    // Generate SEO description: first 200 chars, end at last sentence if possible
    let desc = this.form.value.description || '';
    let shortDesc = desc.slice(0, 200);
    const lastSentenceEnd = Math.max(shortDesc.lastIndexOf('.'), shortDesc.lastIndexOf('!'), shortDesc.lastIndexOf('?'));
    if (lastSentenceEnd > 0) {
      shortDesc = shortDesc.slice(0, lastSentenceEnd + 1);
    }

    const product: Product = {
      ...this.form.value,
      sku,
      isFeatured: true,
      seoTitle: productName, // Bind SEO title as product name
      seoDescription: shortDesc // SEO description: first 200 chars, end at sentence
    };

    this.loading = true;
    this.error = null;

    if (this.editMode && this.productId) {
      // Update product
      this.productService.updateProduct(this.productId, product, this.productImage).subscribe({
        next: () => {
          this.loading = false;
          this.showSnackbar('Product updated successfully!', true);
          setTimeout(() => this.router.navigate(['/management/products']), 1000);
        },
        error: error => {
          this.loading = false;
          this.error = error?.error?.message || 'Failed to update product';
          this.showSnackbar(this.error || 'Failed to update product', false);
          console.error(error);
        }
      });
    } else {
      // Create product
      this.productService.createProduct(product, this.productImage).subscribe({
        next: () => {
          this.loading = false;
          this.showSnackbar('Product added successfully!', true);
          setTimeout(() => this.router.navigate(['/management/products']), 1000);
        },
        error: error => {
          this.loading = false;
          this.error = error?.error?.message || 'Failed to create product';
          this.showSnackbar(this.error || 'Failed to create product', false);
          console.error(error);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/management/products']);
  }

  // Validation Helper
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}

