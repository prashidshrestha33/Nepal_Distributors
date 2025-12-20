import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/management/management.service';
import type { Order } from '../../../../services/management/management.service';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private router: Router
  ) {
    this.form = this.fb.group({
      orderNumber: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0)]],
      status: ['pending', Validators.required]
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
      const order: Order = this.form.value;
      
      this.orderService.createOrder(order).subscribe({
        next: () => {
          this.router.navigate(['/orders']);
        },
        error: (err) => {
          this.error = 'Failed to create order. Please try again.';
          console.error('Error creating order:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
