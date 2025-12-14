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
  styles: [],
})
export class RegisterCompanyFormComponent {
  form: FormGroup;
  loading = false;
  createdCompanyId: number | null = null;
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
      registrationDocument: [null, Validators.required], // To hold the file
      companyType: ['', Validators.required],
      status: ['', Validators.required],
      address: ['', Validators.required],
      googleMapLocation: ['', Validators.required],
    });
  }

  // File change handler
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.fileName = file.name;
      
      // Set file value to form control (registrationDocument)
      this.form.get('registrationDocument')?.setValue(file);

      // Mark file control as touched and update its validity
      this.form.get('registrationDocument')?.markAsTouched();
      this.form.get('registrationDocument')?.updateValueAndValidity();

      // Create file preview (only if it's an image)
      // Read a Data URL for persistence so file can be restored after refresh
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Store file and its DataURL/metadata in the flow service
        const existing = this.flow.getCompanyForm() || {};
        existing.file = file;
        existing.fileDataUrl = dataUrl;
        existing.fileName = file.name;
        existing.fileType = file.type;
        this.flow.setCompanyForm(existing);

        // Save compressed file into IndexedDB (async, don't block UI)
        this.flow.saveCompanyFile(file).catch(e => console.warn('saveCompanyFile failed', e));

        // Create preview if it's an image
        if (file.type.startsWith('image/')) {
          this.filePreview = dataUrl;
        } else {
          this.filePreview = null;
        }
      };
      reader.readAsDataURL(file);
    } else {
      this.fileName = '';
      this.form.get('registrationDocument')?.setValue(null);
      // Clear the native file input's value (allowed only to set empty string)
      try {
        (input as HTMLInputElement).value = '';
      } catch (e) {
        // ignore; browsers may throw in some environments
      }
      this.form.get('registrationDocument')?.updateValueAndValidity();
      this.filePreview = null;
    }
  }

  // Form submit handler
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mark all form controls as touched to trigger validation
      return;
    }

    // Save step1 data locally and navigate to step2 without calling backend yet
    this.loading = true;
    this.error = null;

    const companyData: any = {
      name: (this.form.get('name')?.value || '').toString(),
      companyPerson: (this.form.get('companyPerson')?.value || '').toString().trim(),
      mobilePhone: this.form.get('mobilePhone')?.value || '',
      landLinePhone: this.form.get('landLinePhone')?.value || '',
      companyType: this.form.get('companyType')?.value || '',
      status: this.form.get('status')?.value || '',
      address: this.form.get('address')?.value || '',
      googleMapLocation: this.form.get('googleMapLocation')?.value || '',
    };

    const file: File | null = this.form.get('registrationDocument')?.value || null;
    if (file) {
      companyData.file = file; // keep the File object in memory (SignupFlowService)
      this.fileName = file.name;
    }

    // Persist company data in the flow service (and localStorage for non-file fields)
    this.flow.setCompanyForm(companyData);

    // Small UX pause so button shows loading state briefly
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/signup']);
    }, 200);
  }

  // convenience getters for template validation checks
  get name() {
    return this.form.get('name');
  }

  get companyPerson() {
    return this.form.get('companyPerson');
  }

  get mobilePhone() {
    return this.form.get('mobilePhone');
  }

  get landLinePhone() {
    return this.form.get('landLinePhone');
  }

  get registrationDocument() {
    return this.form.get('registrationDocument');
  }

  get companyType() {
    return this.form.get('companyType');
  }

  get status() {
    return this.form.get('status');
  }

  get address() {
    return this.form.get('address');
  }

  get googleMapLocation() {
    return this.form.get('googleMapLocation');
  }
}
