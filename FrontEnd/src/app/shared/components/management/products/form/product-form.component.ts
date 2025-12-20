import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../../services/management/management.service';
import type { Product } from '../../../../services/management/management.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      status: ['active', Validators.required]
    });
  }

  ngOnInit() {}

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const product: Product = this.form.value;
      
      this.productService.createProduct(product).subscribe({
        next: () => {
          this.router.navigate(['/product']);
        },
        error: (err) => {
          this.error = 'Failed to create product. Please try again.';
          console.error('Error creating product:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
