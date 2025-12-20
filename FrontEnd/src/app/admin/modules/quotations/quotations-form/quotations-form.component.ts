import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuotationsService } from '../../../services/quotations.service';
import { ProductsService } from '../../../services/products.service';

@Component({
  selector: 'app-quotations-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditing ? 'Edit Quotation' : 'Add Quotation' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 rounded-lg shadow space-y-6">
        <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">{{ errorMessage }}</div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quotation # <span class="text-red-500">*</span></label>
            <input type="text" formControlName="quotationNumber" placeholder="Q-001"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="quotationNumber?.invalid && quotationNumber?.touched">
            <p *ngIf="quotationNumber?.invalid && quotationNumber?.touched" class="mt-1 text-sm text-red-600">Required</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">User ID <span class="text-red-500">*</span></label>
            <input type="number" formControlName="userId" placeholder="Enter user ID"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="userId?.invalid && userId?.touched">
            <p *ngIf="userId?.invalid && userId?.touched" class="mt-1 text-sm text-red-600">Required</p>
          </div>
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
export class QuotationsFormComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  errorMessage = '';
  isEditing = false;
  quotationId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private quotationsService: QuotationsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      quotationNumber: ['', Validators.required],
      userId: ['', Validators.required],
      totalAmount: [0],
      status: ['pending']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.quotationId = params['id'];
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const data = this.form.value;
    const request = this.isEditing ? this.quotationsService.updateQuotation(this.quotationId!, data) : this.quotationsService.createQuotation(data);
    request.subscribe({
      next: () => this.router.navigate(['/admin/quotations']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save quotation';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/quotations']);
  }

  get quotationNumber() { return this.form.get('quotationNumber'); }
  get userId() { return this.form.get('userId'); }
}
