import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyService } from '../../../../services/management/company.service';
import type { company } from '../../../../services/management/company.service';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.css'
})
export class CompanyFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private router: Router
  ) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      companyname: ['', Validators.required],
      phone: [''],
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
      const company: company = this.form.value;
      
      this.companyService.createCompany(company).subscribe({
        next: () => {
          this.router.navigate(['/company']);
        },
        error: (err) => {
          this.error = 'Failed to create company. Please try again.';
          console.error('Error creating company:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/companys']);
  }
}
