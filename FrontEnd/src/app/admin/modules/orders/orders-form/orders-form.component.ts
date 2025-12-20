import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService } from '../../../services/orders.service';

@Component({
  selector: 'app-orders-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditing ? 'Edit Order' : 'Add Order' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 rounded-lg shadow space-y-6">
        <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">{{ errorMessage }}</div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Order Number <span class="text-red-500">*</span></label>
          <input type="text" formControlName="orderNumber" placeholder="Enter order number"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="orderNumber?.invalid && orderNumber?.touched">
          <p *ngIf="orderNumber?.invalid && orderNumber?.touched" class="mt-1 text-sm text-red-600">Order number is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">User ID <span class="text-red-500">*</span></label>
          <input type="number" formControlName="userId" placeholder="Enter user ID"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="userId?.invalid && userId?.touched">
          <p *ngIf="userId?.invalid && userId?.touched" class="mt-1 text-sm text-red-600">User ID is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Total Amount <span class="text-red-500">*</span></label>
          <input type="number" formControlName="totalAmount" placeholder="0.00" step="0.01"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="totalAmount?.invalid && totalAmount?.touched">
          <p *ngIf="totalAmount?.invalid && totalAmount?.touched" class="mt-1 text-sm text-red-600">Valid amount is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status <span class="text-red-500">*</span></label>
          <select formControlName="status"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="status?.invalid && status?.touched">
            <option value="">Select status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="delivered">Delivered</option>
          </select>
          <p *ngIf="status?.invalid && status?.touched" class="mt-1 text-sm text-red-600">Status is required</p>
        </div>

        <div class="flex gap-4">
          <button type="submit" [disabled]="form.invalid || submitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ submitting ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" (click)="onCancel()" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>
        </div>
      </form>
    </div>
  `
})
export class OrdersFormComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  errorMessage = '';
  isEditing = false;
  orderId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      orderNumber: ['', Validators.required],
      userId: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0)]],
      status: ['pending', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.orderId = params['id'];
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const data = this.form.value;
    const request = this.isEditing ? this.ordersService.updateOrder(this.orderId!, data) : this.ordersService.createOrder(data);
    request.subscribe({
      next: () => this.router.navigate(['/admin/orders']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save order';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/orders']);
  }

  get orderNumber() { return this.form.get('orderNumber'); }
  get userId() { return this.form.get('userId'); }
  get totalAmount() { return this.form.get('totalAmount'); }
  get status() { return this.form.get('status'); }
}
