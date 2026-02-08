import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductService, StaticValueCatalog } from '../../../../services/management/management.service';
import { StaticValue } from '../../../../services/management/management.service';
import { StaticValueService } from '../../../../services/management/management.service';
import { CategoryService } from '../../../../services/management/management.service';
import { Category } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';


@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
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
  showCategoryMenu = false;
  form!: FormGroup;
  loading: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private http: HttpClient,
    private service: StaticValueService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      id: [null],
      sku: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      shortDescription: [''],
      categoryId: ['', Validators.required],
      companyId: [null],
      credit: [null],
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
      imageName: [''],
      createdBy: [''],
      productImage: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.productId = id ? +id : undefined;
      this.editMode = !!this.productId;
      Promise.all([
        new Promise<void>((resolve) => {
          this.getAllCatalog();
          setTimeout(resolve, 300);
        }),
        new Promise<void>((resolve) => {
          this.loadCategoryTree();
          setTimeout(resolve, 300);
        })
      ]).then(() => {
        if (this.editMode && this.productId) {
          this.loadProductForEdit(this.productId);
        }
      });
    });
  }

  loadProductForEdit(id: number) {
  this.loading = true;

  this.productService.getProductById(id).subscribe({
    next: (res: any) => {
      const product = res.result;

      this.form.patchValue({
        id: product.id,
        sku: product.sku ?? '',
        name: product.name ?? '',
        description: product.description ?? '',
        shortDescription: product.shortDescription ?? '',
        categoryId: product.categoryId,
        companyId: product.companyId,
        credit: product.credit,
        brandId: product.brandId,
        manufacturerId: product.manufacturerId,
        rate: product.rate,
        hsCode: product.hsCode ?? '',
        status: product.status ?? '',
        isFeatured: product.isFeatured ?? true,
        imageName: product.imageName ?? '',
        createdBy: product.createdBy ?? ''
      });  
      if (product?.imageName) {
  const imageUrl = this.getImageUrl(product.imageName);
  this.imagePreview = imageUrl;
}

      this.loading = false;
    },
    error: () => {
      this.loading = false;
      this.error = 'Failed to load product';
    }
  });
}  
 getImageUrl(imageName?: string): string {
    if (!imageName) return 'assets/images/no-image.png';
    return `${environment.apiBaseUrl}/api/CompanyFile/${imageName}`;
  }

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

onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const raw = this.form.getRawValue();

  const product: Product = {
    ...raw,
    isFeatured: true
  };


  this.loading = true;

  let req$: import('rxjs').Observable<any>;
  if (this.editMode && this.productId) {
    req$ = this.productService.updateProduct(this.productId, product, this.productImage);
  } else {
    req$ = this.productService.createProduct(product, this.productImage);
  }

  req$.subscribe({
    next: () => {
      this.loading = false;
      this.showSnackbar(
        this.editMode ? 'Product updated successfully!' : 'Product added successfully!',
        true
      );
      this.router.navigate(['/management/products']);
    },
    error: (err: any) => {
      this.loading = false;
      this.showSnackbar('Operation failed', false);
      console.error(err);
    }
  });
}
  goBack() {
    this.router.navigate(['/management/products']);
  }

  // Validation Helper
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  onDragOver(event: DragEvent) {
  event.preventDefault();
}

onDragLeave(event: DragEvent) {
  event.preventDefault();
}

onDrop(event: DragEvent) {
  event.preventDefault();

  const file = event.dataTransfer?.files[0];
  if (file) {
    this.previewFile(file);
  }
}
previewFile(file: File) {
  if (!file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    this.imagePreview = reader.result as string;
  };
  reader.readAsDataURL(file);
}
}

