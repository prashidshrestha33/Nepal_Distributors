import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QuotationService } from '../../../../services/management/management.service';
import type { Quotation } from '../../../../services/management/management.service';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quotation-form.component.html',
  styleUrl: './quotation-form.component.css'
})
export class QuotationFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private quotationService: QuotationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      quotationNumber: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(0)]],
      status: ['draft', Validators.required]
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
      const quotation: Quotation = this.form.value;
      
      this.quotationService.createQuotation(quotation).subscribe({
        next: () => {
          this.router.navigate(['/quotations']);
        },
        error: (err) => {
          this.error = 'Failed to create quotation. Please try again.';
          console.error('Error creating quotation:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/quotations']);
  }
}
