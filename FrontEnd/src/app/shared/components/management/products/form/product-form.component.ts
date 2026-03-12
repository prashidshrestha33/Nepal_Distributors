import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import {
  Product,
  ProductService,
  StaticValueCatalog,
  StaticValue,
  StaticValueService,
  CategoryService,
  Category
} from '../../../../services/management/management.service';

import { environment } from '../../../../../../environments/environment';
import { CatagoryDynamicComponent } from '../../../CustomComponents/CatagoryDynamic/catagory-dynamic.component';


@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CatagoryDynamicComponent
  ],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {

  @Input() editMode: boolean = false;
  @Input() productId?: number;

  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;

  loading = false;
  error: string | null = null;

  snackbar = {
    show: false,
    message: '',
    success: true
  };

  /* -------------------- CATEGORY -------------------- */

  treeCategories: Category[] = [];
  flatCategories: Category[] = [];

  categoryControl = new FormControl('');
  selectedCategoryId?: number;


  /* -------------------- BRAND -------------------- */

  brandControl = new FormControl('');
  brands: StaticValue[] = [];
  filteredBrands: StaticValue[] = [];
  showBrandMenu = false;


  /* -------------------- MANUFACTURE -------------------- */

  manufactureControl = new FormControl('');
  manufactures: StaticValue[] = [];
  filteredManufacture: StaticValue[] = [];
  showManufactureMenu = false;


  /* -------------------- IMAGES -------------------- */

  productImages: {
    file: File | null;
    previewUrl: string;
    isDefault: boolean
  }[] = [];


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
      name: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: ['', Validators.required],
      brandId: ['', Validators.required],
      manufacturerId: ['', Validators.required],
      rate: [0, [Validators.required, Validators.min(0)]],
      hsCode: ['']
    });

  }


  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = params.get('id');

      this.productId = id ? +id : undefined;
      this.editMode = !!this.productId;


      /* -------- SNACKBAR FROM NAVIGATION -------- */

      const nav = this.router.getCurrentNavigation();
      const snackbar = nav?.extras?.state?.['snackbar'];

      if (snackbar) {
        this.snackbar = {
          show: true,
          message: snackbar.message,
          success: snackbar.success
        };

        setTimeout(() => {
          this.snackbar.show = false;
        }, 3000);
      }


      /* -------- BRAND SEARCH -------- */

      this.brandControl.valueChanges.subscribe(value => {
        this.filteredBrands = this.filterItems(this.brands, value || '');
        this.showBrandMenu = true;
      });


      /* -------- MANUFACTURE SEARCH -------- */

      this.manufactureControl.valueChanges.subscribe(value => {
        this.filteredManufacture = this.filterItems(this.manufactures, value || '');
        this.showManufactureMenu = true;
      });


      /* -------- LOAD DATA -------- */

      Promise.all([
        this.getAllCatalogs(),
        this.loadCategoryTree()
      ]).then(() => {

        if (this.editMode && this.productId) {
          this.loadProductForEdit(this.productId);
        }

      });

    });

  }


  /* =========================================================
     FILTER
  ========================================================= */

  filterItems(list: StaticValue[], search: string): StaticValue[] {
    const value = (search || '').toLowerCase();

    return list.filter(i =>
      i.staticValueKey.toLowerCase().includes(value)
    );
  }


  /* =========================================================
     STATIC VALUES
  ========================================================= */

  async getAllCatalogs() {

    this.loading = true;

    try {

      const catalogs: StaticValueCatalog[] | undefined =
        await this.service.getStaticValuesCatagory().toPromise();


      /* -------- BRAND -------- */

      const brandCatalog = catalogs?.find(
        c => c.catalogName === 'Brand'
      );

      if (brandCatalog) {

        const data =
          await this.service.getStaticValues(brandCatalog.catalogId).toPromise();

        this.brands = data || [];
        this.filteredBrands = [...this.brands];

      }


      /* -------- MANUFACTURE -------- */

      const manufactureCatalog = catalogs?.find(
        c => c.catalogName === 'Manufacture'
      );

      if (manufactureCatalog) {

        const data =
          await this.service.getStaticValues(manufactureCatalog.catalogId).toPromise();

        this.manufactures = data || [];
        this.filteredManufacture = [...this.manufactures];

      }

    }
    catch (err) {

      this.error = 'Failed to load catalogs';
      console.error(err);

    }
    finally {

      this.loading = false;

    }

  }


  /* =========================================================
     CATEGORY TREE
  ========================================================= */

  loadCategoryTree(): Promise<void> {

    return new Promise(resolve => {

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


  flattenCategories(
    categories: Category[],
    depth: number = 1
  ): Category[] {

    let result: Category[] = [];

    for (const cat of categories) {

      result.push({ ...cat, depth });

      if (cat.children) {
        result = result.concat(
          this.flattenCategories(cat.children, depth + 1)
        );
      }

    }

    return result;

  }


  /* =========================================================
     LOAD PRODUCT FOR EDIT
  ========================================================= */

  loadProductForEdit(id: number) {

    this.loading = true;

    this.productService.getProductById(id).subscribe({

      next: res => {

        const product: Product =
          (res as any)?.result ?? res;

        this.form.patchValue(product);


        /* -------- BRAND -------- */

        const brand = this.brands.find(
          b => b.staticId === product.brandId
        );

        if (brand) {

          this.brandControl.setValue(
            brand.staticValueKey,
            { emitEvent: true }
          );

          this.form.get('brandId')?.setValue(brand.staticId);

          this.filteredBrands = [...this.brands];
          this.showBrandMenu = false;

        }


        /* -------- MANUFACTURE -------- */

        const manu = this.manufactures.find(
          m => m.staticId === product.manufacturerId
        );

        if (manu) {

          this.manufactureControl.setValue(
            manu.staticValueKey,
            { emitEvent: true }
          );

          this.form.get('manufacturerId')?.setValue(manu.staticId);

          this.filteredManufacture = [...this.manufactures];
          this.showManufactureMenu = false;

        }


        /* -------- CATEGORY -------- */

        if (product.categoryId) {
          this.selectedCategoryId = product.categoryId;
        }


        /* -------- IMAGES -------- */

        if (product?.images?.length) {

          this.productImages = product.images.map(img => ({
            file: null,
            previewUrl: this.getImageUrl(img.imageName),
            isDefault: img.isDefault
          }));

        }

        this.loading = false;

      },

      error: () => {

        this.error = 'Failed to load product';
        this.loading = false;

      }

    });

  }


  getImageUrl(imageName?: string): string {

    return imageName
      ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`
      : 'assets/images/no-image.png';

  }


  /* =========================================================
     BRAND
  ========================================================= */

  selectBrand(brand: StaticValue) {

    this.brandControl.setValue(brand.staticValueKey);
    this.form.get('brandId')?.setValue(brand.staticId);

    this.showBrandMenu = false;
    this.filteredBrands = [];

  }


  clearBrand() {

    this.brandControl.setValue('');
    this.form.get('brandId')?.setValue(null);

  }


  /* =========================================================
     MANUFACTURE
  ========================================================= */

  selectManufacture(manu: StaticValue) {

    this.manufactureControl.setValue(manu.staticValueKey);
    this.form.get('manufacturerId')?.setValue(manu.staticId);

    this.showManufactureMenu = false;
    this.filteredManufacture = [];

  }


  clearManufacture() {

    this.manufactureControl.setValue('');
    this.form.get('manufacturerId')?.setValue(null);

  }


  /* =========================================================
     CATEGORY
  ========================================================= */

  onCategoryChosen(categoryId: number) {

    debugger;

    this.selectedCategoryId = categoryId;
    this.form.get('categoryId')?.setValue(categoryId);

  }


  /* =========================================================
     IMAGE HANDLING
  ========================================================= */

  onMultipleImageChange(event: any) {

    const files: FileList = event.target.files;

    if (!files) return;

    for (
      let i = 0;
      i < files.length && this.productImages.length < 8;
      i++
    ) {

      const file = files[i];

      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();

      reader.onload = () => {

        this.productImages.push({
          file,
          previewUrl: reader.result as string,
          isDefault: this.productImages.length === 0
        });

      };

      reader.readAsDataURL(file);

    }

    event.target.value = '';

  }


  setDefaultImage(index: number) {

    this.productImages.forEach(
      (img, i) => img.isDefault = i === index
    );

  }
  removeImage(url: string) {
    debugger;
  this.productImages = this.productImages.filter(img => img.previewUrl !== url);
}


  // removeImage(removeImagename: string) {
  //   debugger;

  //   // const wasDefault = this.productImages[removeImagename].isDefault;

  //   // this.productImages.splice(index, 1);

  //   // if (wasDefault && this.productImages.length) {
  //   //   this.productImages[0].isDefault = true;
  //   // }

  // }


  /* =========================================================
     SUBMIT
  ========================================================= */

  onSubmit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const product: Product = {
      ...this.form.getRawValue(),
      isFeatured: true
    };

    this.loading = true;
    debugger;

    const imagesToSend =
      this.productImages
        .filter(i => i.file)
        .map(i => ({
          file: i.file!,
          isDefault: i.isDefault
        }));


    const req$ =
      this.editMode && this.productId
        ? this.productService.updateProduct(
            this.productId,
            product,
            imagesToSend
          )
        : this.productService.createProduct(
            product,
            imagesToSend
          );


    req$.subscribe({

      next: () => {

        this.loading = false;

        const message =
          this.editMode
            ? 'Product updated successfully!'
            : 'Product added successfully!';


        this.router.navigate(
          ['/management/products'],
          {
            state: {
              snackbar: {
                message: message,
                success: true
              }
            }
          }
        );

      },

      error: err => {

        this.loading = false;

        console.error(err);

        this.showSnackbar(
          'Product update failed',
          false
        );

      }

    });

  }


  /* =========================================================
     UTILITIES
  ========================================================= */

  isFieldInvalid(fieldName: string): boolean {

    const field = this.form.get(fieldName);

    return !!(
      field &&
      field.invalid &&
      (field.dirty || field.touched)
    );

  }


  private showSnackbar(
    message: string,
    success: boolean = true
  ) {

    debugger;

    this.snackbar = {
      show: true,
      message,
      success
    };

    setTimeout(() => {
      this.snackbar.show = false;
    }, 5000);

  }


  goBack() {

    this.router.navigate(['/management/products']);

  }

}