import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StaticValueService } from '../../../../services/management/management.service';
import type { StaticValue } from '../../../../services/management/management.service';

@Component({
  selector: 'app-static-value-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './static-value-form.component.html',
  styleUrl: './static-value-form.component.css'
})
export class StaticValueFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private staticValueService: StaticValueService,
    private router: Router
  ) {
    this.form = this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required],
      description: [''],
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
      const staticValue: StaticValue = this.form.value;
      
      this.staticValueService.createStaticValue(staticValue).subscribe({
        next: () => {
          this.router.navigate(['/static-values']);
        },
        error: (err) => {
          this.error = 'Failed to create static value. Please try again.';
          console.error('Error creating static value:', err);
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/static-values']);
  }
}
