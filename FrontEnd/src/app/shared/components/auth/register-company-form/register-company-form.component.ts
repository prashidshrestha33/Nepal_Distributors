import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SignupFlowService } from '../../../services/signup-flow.service';

@Component({
  selector: 'app-register-company-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-company-form.component.html',
  styles: ``
})
export class RegisterCompanyFormComponent {
  form: FormGroup;
  loading = false;
  createdCompanyId: string | null = null;
  error: string | null = null;
  fileName = '';
  filePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private flow: SignupFlowService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      companyPerson: ['', Validators.required],
      mobilePhone: ['', Validators.required],
      landLinePhone: ['', Validators.required],
      registrationDocument: [null, Validators.required],
      companyType: ['', Validators.required],
      status: ['', Validators.required],
      address: ['', Validators.required],
      googleMapLocation: ['', Validators.required]
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName = file.name;
      // set file and update validity
      this.form.get('registrationDocument')?.setValue(file);
      this.form.get('registrationDocument')?.markAsTouched();
      this.form.get('registrationDocument')?.updateValueAndValidity();
      // create preview if image
      if (file.type.startsWith('image/')) {
        this.filePreview = URL.createObjectURL(file);
      } else {
        this.filePreview = null;
      }
    } else {
      this.fileName = '';
      this.form.get('registrationDocument')?.setValue(null);
      this.form.get('registrationDocument')?.updateValueAndValidity();
      this.filePreview = null;
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.createdCompanyId = null;
    const formData = new FormData();
    // Map Company.* fields
    formData.append('Company.Name', this.form.get('name')?.value || '');
    formData.append('Company.CompanyPerson', this.form.get('companyPerson')?.value || '');
    formData.append('Company.MobilePhone', this.form.get('mobilePhone')?.value || '');
    formData.append('Company.LandLinePhone', this.form.get('landLinePhone')?.value || '');
    formData.append('Company.CompanyType', this.form.get('companyType')?.value || '');
    formData.append('Company.Address', this.form.get('address')?.value || '');
    formData.append('Company.GoogleMapLocation', this.form.get('googleMapLocation')?.value || '');

    const file: File | null = this.form.get('registrationDocument')?.value || null;
    if (file) {
      formData.append('CompanyDocument', file, file.name);
    }

    this.authService.registerStep1(formData).subscribe({
      next: (res: any) => {
        this.loading = false;
        const companyId = res?.companyId ?? res?.companyid ?? null;
        if (companyId) {
          // store id in flow service and navigate to signup step
          this.flow.setCompanyId(Number(companyId));
          this.router.navigate(['/signup']);
        } else {
          this.error = res?.message || 'Company created but no ID returned.';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to create company. Please try again.';
        console.error('register company error', err);
      }
    });
  }
}
