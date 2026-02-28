import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductService, StaticValueCatalog, StaticValue, StaticValueService, CategoryService, Category } from '../../../../services/management/management.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  @Input() editMode: boolean = false;
  @Input() productId?: number;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  loading = false;
  error: string | null = null;

  snackbar = { show: false, message: '', success: true };

  // Categories & Static Values
  treeCategories: Category[] = [];
  flatCategories: Category[] = [];
  showCategoryMenu = false;

  items: StaticValue[] = [];             
  filteredItems: StaticValue[] = [];
  filteredManufacture: StaticValue[] = []; // Manufacture

  // Image
  productImage?: File;
  imagePreview: string | ArrayBuffer | null = null;
  productImages: {
  file: File;
  previewUrl: string;
  isDefault: boolean;
}[] = [];


  // Dropdown visibility
  showBrandMenu = false;
  showManufactureMenu = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
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
        this.getAllCatalogs(),
        this.loadCategoryTree()
      ]).then(() => {
        if (this.editMode && this.productId) this.loadProductForEdit(this.productId);
      });
    });
  }

  // ------------------- API & Data -------------------

  async getAllCatalogs() {
  this.loading = true;
  try {
    const catalogs: StaticValueCatalog[] | undefined = await this.service.getStaticValuesCatagory().toPromise();

    // Load Manufacture Catalog
    const manufactureCatalog = catalogs?.find(c => c.catalogName === 'Manufacture');
    if (manufactureCatalog) {
      this.loadStaticValue(manufactureCatalog.catalogId, this.items, this.filteredManufacture);
    }

    // Load Brand Catalog
    const brandCatalog = catalogs?.find(c => c.catalogName === 'Brand');
    if (brandCatalog) {
      this.loadStaticValue(brandCatalog.catalogId, this.items, this.filteredItems);
    }

  } catch (err) {
    this.error = 'Failed to load catalog list';
    console.error(err);
  } finally {
    this.loading = false;
  }
}


  loadStaticValue(catalogId: number, targetArray: StaticValue[], filteredArray: StaticValue[]): void {
  if (!catalogId) return;
  this.loading = true;
  this.service.getStaticValues(catalogId).subscribe({
    next: (data: StaticValue[]) => {
      targetArray.splice(0, targetArray.length, ...data);
      filteredArray.splice(0, filteredArray.length, ...data);
      this.loading = false;
    },
    error: () => {
      targetArray.splice(0, targetArray.length, ...([] as StaticValue[]));
      filteredArray.splice(0, filteredArray.length, ...([] as StaticValue[]));
      this.loading = false;
    }
  });
}

  loadCategoryTree(): Promise<void> {
    return new Promise((resolve) => {
      this.categoryService.getTreeCategories().subscribe({
        next: (tree: Category[]) => {
          this.treeCategories = tree;
          this.flatCategories = this.flattenCategories(tree);
          this.cdr.markForCheck();
          resolve();
        },
        error: err => {
          console.error('Error loading categories', err);
          this.cdr.markForCheck();
          resolve();
        }
      });
    });
  }

  flattenCategories(categories: Category[], depth: number = 1): Category[] {
    let result: Category[] = [];
    for (const cat of categories) {
      result.push({ ...cat, depth });
      if (cat.children) result = result.concat(this.flattenCategories(cat.children, depth + 1));
    }
    return result;
  }

  loadProductForEdit(id: number) {
  this.loading = true;
  this.productService.getProductById(id).subscribe({
    next: res => {
      const product: Product = (res as any)?.result ?? res;
      this.form.patchValue(product); 
      if (product?.imageName) {
        this.imagePreview = this.getImageUrl(product.imageName);
      }
      const manufactureName = this.getManufactureName(product.manufacturerId);
      this.loading = false;
    },
    error: () => {
      this.error = 'Failed to load product';
      this.loading = false;
    }
  });
}

  getImageUrl(imageName?: string): string {
    return imageName ? `${environment.apiBaseUrl}/api/CompanyFile/${imageName}` : 'assets/images/no-image.png';
  }

  // ------------------- Dropdowns -------------------

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

  selectCategory(cat: Category) { this.form.get('categoryId')?.setValue(cat.id); this.showCategoryMenu = false; }
  selectBrand(brand: StaticValue) {
  this.form.get('brandId')?.setValue(brand.staticId); // Set staticId for Brand
  this.showBrandMenu = false;
}

selectManufacture(m: StaticValue) {
  this.form.get('manufacturerId')?.setValue(m.staticId); // Set staticId for Manufacture
  this.showManufactureMenu = false;
}


  clearCategory() { this.form.get('categoryId')?.setValue(null); this.showCategoryMenu = false; }
  clearBrand() { this.form.get('brandId')?.setValue(null); this.showBrandMenu = false; }
  clearManufacture() { this.form.get('manufacturerId')?.setValue(null); this.showManufactureMenu = false; }

  getBrandName(id: number): string | null {
    const brand = this.items.find(b => b.staticId === id);
    return brand ? brand.staticValueKey : null;
  }

  getManufactureName(id: number): string | null {
    const m = this.filteredManufacture.find(b => b.staticId === id);
    return m ? m.staticValueKey : null;
  }

  // ------------------- Image -------------------

  onProductImageChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Only image files are allowed'); return; }

    this.productImage = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result;
    reader.readAsDataURL(file);
  }

  // removeImage() {
  //   this.productImage = undefined;
  //   this.imagePreview = null;
  //   if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
  //   this.form.get('productImage')?.setValue(null);
  // }

  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDragLeave(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.previewFile(file);
  }
  previewFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = reader.result;
    reader.readAsDataURL(file);
  }

  // ------------------- Submit -------------------
onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const product: Product = { ...this.form.getRawValue(), isFeatured: true };
  this.loading = true;

  const req$ = this.editMode && this.productId
    ? this.productService.updateProduct(this.productId, product, this.productImages)
    : this.productService.createProduct(product, this.productImages);

  req$.subscribe({
    next: () => {
      this.loading = false;
      this.showSnackbar(
        this.editMode ? 'Product updated successfully!' : 'Product added successfully!',
        true
      );
      this.router.navigate(['/management/products']);
    },
    error: err => {
      this.loading = false;
      this.showSnackbar('Operation failed', false);
      console.error(err);
    }
  });
}
onMultipleImageChange(event: any) {
  const files: FileList = event.target.files;

  if (!files) return;

  for (let i = 0; i < files.length; i++) {

    if (this.productImages.length >= 8) break;

    const file = files[i];

    if (!file.type.startsWith('image/')) continue;

    const reader = new FileReader();
    reader.onload = () => {
      this.productImages.push({
        file: file,
        previewUrl: reader.result as string,
        isDefault: this.productImages.length === 0 // first image default
      });
    };

    reader.readAsDataURL(file);
  }

  event.target.value = '';
}

removeImage(index: number) {
  const wasDefault = this.productImages[index].isDefault;
  this.productImages.splice(index, 1);

  if (wasDefault && this.productImages.length > 0) {
    this.productImages[0].isDefault = true;
  }
}

setDefaultImage(index: number) {
  this.productImages.forEach((img, i) => {
    img.isDefault = i === index;
  });
}

  goBack() { this.router.navigate(['/management/products']); }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private showSnackbar(message: string, success: boolean = true) {
    this.snackbar = { show: true, message, success };
    setTimeout(() => this.snackbar.show = false, 5000);
  }
}
