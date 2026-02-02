import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, Product } from '../../../../services/management/management.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule], // Add Angular Material modules and shared modules as needed
})
export class ProductEditComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  productId?: number;
  imagePreview: string | ArrayBuffer | null = null;
  productImage?: File;
  isEditMode = false;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: [null, Validators.required],
      brandId: [null, Validators.required],
      manufacturerId: [null, Validators.required],
      rate: [null, Validators.required],
      hsCode: [''],
      credit: [''],
      imageName: [''],
      isFeatured: [false],
      seoTitle: [''],
      seoDescription: [''],
      attributes: [''],
      status: [''],
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = +id;
        this.isEditMode = true;
        this.fetchProduct(+id);
      }
    });
  }

  fetchProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product: Product) => {
        this.form.patchValue(product);
        if (product.imageUrl) {
          this.imagePreview = product.imageUrl;
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load product.';
        this.loading = false;
      }
    });
  }

  onFileChange(event: any) {
    const file = event.target.files && event.target.files.length > 0 ? event.target.files[0] : undefined;
    if (!file) return;
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
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.form.get('imageName')?.setValue('');
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    const product: Product = {
      ...this.form.value,
      id: this.productId || 0,
    };
    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, product, this.productImage).subscribe({
        next: () => {
          this.snackBar.open('Product updated successfully!', 'Close', { duration: 2000 });
          this.router.navigate(['/management/products']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update product';
          this.loading = false;
        }
      });
    } else {
      this.productService.createProduct(product, this.productImage).subscribe({
        next: () => {
          this.snackBar.open('Product update successfully!', 'Close', { duration: 2000 });
          this.router.navigate(['/management/products']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to create product';
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/management/products']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
