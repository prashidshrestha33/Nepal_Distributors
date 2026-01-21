import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
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
      shortDescription: [null],
      categoryId: ['', Validators.required],
      subCategoryId: [0],
      subSubCategoryId: [0],
      brandId: ['', Validators.required],
      manufacturerId: [0, Validators.required],
      rate: [0, [Validators.required, Validators.min(0)]],
      hsCode: ['', Validators.required],
      status: ['Active', Validators.required],
      isFeatured: [true],
      seoTitle: ['', Validators.required],
      seoDescription: ['', Validators.required],
      attributes: [''],
      createdBy: ['admin', Validators.required],
      productImage: [''],
    });
  }

  // ---------------- NG ON INIT ----------------
ngOnInit(): void {
  this.getAllCatalog();
  this.loadCategoryTree();
}

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

  // For custom brand dropdown
  showBrandMenu = false;
  getBrandName(id: number): string | null {
    const brand = this.filteredItems.find(b => b.staticId === id);
    return brand ? brand.staticValueKey : null;
  }

  selectBrand(brand: any) {
    this.form.get('brandId')?.setValue(brand.staticId);
    this.showBrandMenu = false;
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

private updateSku() {
  const categoryId = this.form.get('categoryId')?.value;
  const name = this.form.get('name')?.value || '';
  const selectedCategory = this.staticFilteredItems.find(cat => cat.catalogId === categoryId);
  if (selectedCategory && name) {
    const sku = `${selectedCategory.catalogName}-${name}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.form.get('sku')?.setValue(sku, { emitEvent: false });
    console.log(sku);
  }
}

  // ---------------- LOAD STATIC VALUES ----------------

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
        console.log(this.filteredItems);
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

  //Load Catalog
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


  // ---------------- FILE HANDLERS ----------------

  onProductImageChange(event: any) {
    this.productImage =
      event.target.files && event.target.files.length > 0
        ? event.target.files[0]
        : undefined;
  }

  // ---------------- SUBMIT ----------------

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const product: Product = {
      ...this.form.value,
      isFeatured: true
    };

    this.loading = true;
    this.error = null;

    this.productService.createProduct(product, this.productImage).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/management/products']);
      },
      error: error => {
        this.loading = false;
        this.error = error?.error?.message || 'Failed to create product';
        console.error(error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/management/products']);
  }

  // ---------------- VALIDATION ----------------

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
