import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { StaticValueService,StaticValue } from '../../../../services/management/management.service';

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

  constructor(
    private fb: FormBuilder,
    private staticValueService: StaticValueService,
    private router: Router,
    private route: ActivatedRoute
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
      if((staticid||staticid!=undefined)&&(id ||id!=undefined)){
        this.catalogId = +id;
        this.staticId=staticid;
         this.load();
      } 
      else if(id||id!=undefined){
        this.catalogId = +id;
      }
      else  this.router.navigate(['/management/static-values-catalog']); 
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
           staticValueKey:data.staticValueKey,
           displayOrder:data.displayOrder,
           staticId: data.staticId
      });
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
      if(this.staticId==null){
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
    else{
           this.staticValueService.updateStaticValue(staticValue).subscribe({
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
  }

  goBack() {
    this.router.navigate(['/static-values']);
  }
}
