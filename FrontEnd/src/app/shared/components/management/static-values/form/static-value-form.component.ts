import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { StaticValueService,StaticValue } from '../../../../services/management/management.service';
import { BreadcrumbService } from '../../../../services/breadcrumb.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-static-value-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './static-value-form.component.html',
  styleUrl: './static-value-form.component.css'
})
export class StaticValueFormComponent implements OnInit {
  items:  StaticValue[] = [];
  form!: FormGroup;
  loading = false;
  error: string | null = null;
  catalogId: number | null = null;
  staticId: number | null = null;
  
  catalogTitle = 'Static Value';
  keyTitle = 'Key';
  dataTitle = 'Value';

  catalogType = '';
  isUploadingFile = false;
  uploadedFileName: string | null = null;
  /** Controls whether the key field shows a text input or an image uploader */
  keyInputMode: 'text' | 'upload' = 'text';
  /** Saves the text value so it survives switching to upload and back */
  private savedTextKey = '';

  constructor(
    private fb: FormBuilder,
    private staticValueService: StaticValueService,
    private router: Router,
    private route: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {
    this.form = this.fb.group({
      catalogId: [''],
      staticData: ['', Validators.required],
      staticValueKey: ['', Validators.required],
      displayOrder: [''],
      staticId: [''],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['catalogId'];
      const staticid = params['staticid'];
      if (id || id != undefined) {
        this.catalogId = +id;
        this.staticId = staticid;
      } else {
        this.router.navigate(['/management/static-values-catalog']);
        return;
      }
      
      // Load catalog info for titles first
      if (this.catalogId) {
        this.staticValueService.getStaticValuesCatagory().subscribe(catalogs => {
          const currentCatalog = catalogs.find(c => c.catalogId === this.catalogId);
          if (currentCatalog) {
            this.catalogTitle = currentCatalog.catalogTitle || currentCatalog.catalogName || 'Static Value';
            this.keyTitle = currentCatalog.keyTitle || 'Key';
            this.dataTitle = currentCatalog.dataTitle || 'Value';
            this.catalogType = currentCatalog.catalogType || '';
            // Default mode based on catalog type
            const t = this.catalogType.toLowerCase();
            this.keyInputMode = (t === 'upload' || t === 'homepage' || t === 'hjomepage') ? 'upload' : 'text';
            
            // Update breadcrumb
            const action = this.staticId ? 'Edit' : 'Add';
            this.breadcrumbService.updateLastBreadcrumbLabel(`${action} ${this.catalogTitle}`);
          }

          // Load static value details if editing, now that catalogType is loaded
          if (this.staticId) {
            this.load();
          }
        });
      }
    });
    
    this.form.patchValue({
      catalogId: this.catalogId,
      staticId: this.staticId
    });
  }
  
  load(): void {
    if (!this.catalogId) {
      this.error = 'Invalid catalog ID';
      return;
    }
    this.loading = true;
    this.error = null;

    // Use correct property names matching your C# model binding (typically camelCase)
    const filter = {
      catalogId: this.catalogId?.toString() ?? '',   // If catalogId is null/undefined, use ''
      staticId: this.staticId?.toString() ?? '',
      key: '' // Set appropriate key here if needed
    };

    this.staticValueService.getStaticValueByFilter(filter).subscribe({
      next: (data: StaticValue) => { // Single StaticValue as returned by /GetStaticValue
        this.items = [data]; 
        this.form.patchValue({
            catalogId: data.catalogId,
            staticData: data.staticData,
            staticValueKey: data.staticValueKey,
            displayOrder: data.displayOrder,
            staticId: data.staticId
        });

        const isImg = this.isImageFilename(data.staticValueKey);
        if (isImg) {
          // Stored value is an image — switch to upload mode
          this.uploadedFileName = data.staticValueKey || null;
          this.keyInputMode = 'upload';
          this.savedTextKey = '';
        } else {
          // Stored value is text — stay in text mode and persist it
          this.savedTextKey = data.staticValueKey || '';
          this.uploadedFileName = null;
          this.keyInputMode = 'text';
          // Re-patch to guarantee the text input displays the value
          this.form.patchValue({ staticValueKey: this.savedTextKey });
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.items = [];
        this.error = 'Failed to load static value.';
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const staticValue: StaticValue = this.form.value;
      if (this.staticId == null) {
        this.staticValueService.createStaticValue(staticValue).subscribe({
          next: () => {
            this.router.navigate(['/management/static-values'], { queryParams: { catalogId: this.catalogId } });
          },
          error: (err) => {
            this.error = 'Failed to create static value. Please try again.';
            console.error('Error creating static value:', err);
            this.loading = false;
          }
        });
      } else {
        this.staticValueService.updateStaticValue(staticValue).subscribe({
          next: () => {
            this.router.navigate(['/management/static-values'], { queryParams: { catalogId: this.catalogId } });
          },
          error: (err) => {
            this.error = 'Failed to update static value. Please try again.';
            console.error('Error updating static value:', err);
            this.loading = false;
          }
        });
      }
    }
  }

  goBack() {
    this.router.navigate(['/management/static-values'], { queryParams: { catalogId: this.catalogId } });
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploadingFile = true;
    this.error = null;

    this.staticValueService.uploadFile(file).subscribe({
      next: (res) => {
        this.uploadedFileName = res.fileName;
        if (this.catalogType?.toLowerCase() === 'upload' || this.catalogType?.toLowerCase() === 'homepage' || this.catalogType?.toLowerCase() === 'hjomepage') {
          this.form.patchValue({ staticValueKey: res.fileName });
        } else {
          this.form.patchValue({ staticData: res.fileName });
        }
        this.isUploadingFile = false;
      },
      error: (err) => {
        this.error = 'Failed to upload file. Please try again.';
        console.error(err);
        this.isUploadingFile = false;
      }
    });
  }

  getImageUrl(imageName: string): string {
    if (!imageName) return '';
    return `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}`;
  }

  /** Switch between text and upload key input mode */
  setKeyInputMode(mode: 'text' | 'upload') {
    if (mode === 'text') {
      // Save the current text before switching away from upload
      this.keyInputMode = 'text';
      this.uploadedFileName = null;
      // Restore saved text key — never wipe it
      this.form.patchValue({ staticValueKey: this.savedTextKey });
    } else {
      // Save the current text value before switching to upload
      this.savedTextKey = this.form.get('staticValueKey')?.value || '';
      this.keyInputMode = 'upload';
      // Restore uploaded filename if one was previously uploaded
      this.form.patchValue({ staticValueKey: this.uploadedFileName || '' });
    }
  }

  /** Returns true if string looks like an image file name */
  private isImageFilename(s?: string | null): boolean {
    if (!s) return false;
    const lower = s.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'].some(ext => lower.endsWith(ext));
  }
}
