import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StaticValuesService } from '../../../services/static-values.service';

@Component({
  selector: 'app-static-values-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">{{ isEditing ? 'Edit Static Value' : 'Add Static Value' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white p-6 rounded-lg shadow space-y-6">
        <div *ngIf="errorMessage" class="p-4 bg-red-100 text-red-700 rounded-lg">{{ errorMessage }}</div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Catalog Name <span class="text-red-500">*</span></label>
          <input type="text" formControlName="catalogName" placeholder="e.g., company_type"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="catalogName?.invalid && catalogName?.touched">
          <p *ngIf="catalogName?.invalid && catalogName?.touched" class="mt-1 text-sm text-red-600">Catalog name is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Display Name <span class="text-red-500">*</span></label>
          <input type="text" formControlName="displayName" placeholder="e.g., Importer"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="displayName?.invalid && displayName?.touched">
          <p *ngIf="displayName?.invalid && displayName?.touched" class="mt-1 text-sm text-red-600">Display name is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Value <span class="text-red-500">*</span></label>
          <input type="text" formControlName="value" placeholder="Enter value"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            [class.border-red-500]="value?.invalid && value?.touched">
          <p *ngIf="value?.invalid && value?.touched" class="mt-1 text-sm text-red-600">Value is required</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea formControlName="description" placeholder="Enter description"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"></textarea>
        </div>

        <div>
          <label class="flex items-center gap-2">
            <input type="checkbox" formControlName="isActive"
              class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
            <span class="text-sm font-medium text-gray-700">Active</span>
          </label>
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
export class StaticValuesFormComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  errorMessage = '';
  isEditing = false;
  valueId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private staticValuesService: StaticValuesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      catalogName: ['', Validators.required],
      displayName: ['', Validators.required],
      value: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.valueId = Number(params['id']);
        this.loadValue(this.valueId);
      }
    });
  }

  loadValue(id: number) {
    this.staticValuesService.getStaticValue(id).subscribe({
      next: (value) => {
        this.form.patchValue(value);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load static value';
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const data = this.form.value;
    const request = this.isEditing ? this.staticValuesService.updateStaticValue(this.valueId!, data) : this.staticValuesService.createStaticValue(data);
    request.subscribe({
      next: () => this.router.navigate(['/admin/static-values']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to save static value';
        this.submitting = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/static-values']);
  }

  get catalogName() { return this.form.get('catalogName'); }
  get displayName() { return this.form.get('displayName'); }
  get value() { return this.form.get('value'); }
}
