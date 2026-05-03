import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService, FeedbackCategoryDto } from '../../../../services/feedback.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-feedback-submit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feedback-submit.component.html'
})
export class FeedbackSubmitComponent implements OnInit {
  feedbackForm: FormGroup;
  categories: FeedbackCategoryDto[] = [];
  selectedFile: File | null = null;
  userEmail: string = '';
  userName: string = '';
  userPhone: string = '';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) {
    this.feedbackForm = this.fb.group({
      categoryId: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadUserInfo();
  }

  loadCategories() {
    this.feedbackService.getCategories().subscribe({
      next: (res: any) => this.categories = res.result || res || [],
      error: (err) => console.error('Error loading categories', err)
    });
  }

  loadUserInfo() {
    const claims = this.authService.getTokenClaims();
    if (claims) {
      this.userName = claims.unique_name || claims.name || claims.FullName || 'User'; 
      this.userEmail = claims.email || claims.Email || '';
      
      const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          this.userPhone = userObj.phone || userObj.Phone || '';
        } catch(e) {}
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.feedbackForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const formData = new FormData();
    const claims = this.authService.getTokenClaims();
    
    if (claims && (claims.nameid || claims.Id)) formData.append('userId', claims.nameid || claims.Id);
    if (claims && claims.company_id) formData.append('companyId', claims.company_id);
    
    const cat = this.categories.find(c => c.staticValueKey == this.feedbackForm.value.categoryId);
    formData.append('subject', cat ? cat.staticData : 'Feedback');
    formData.append('message', this.feedbackForm.value.message);
    
    if (this.selectedFile) {
      formData.append('screenshot', this.selectedFile);
    }

    this.feedbackService.submitFeedback(formData).subscribe({
      next: (res) => {
        this.successMessage = 'Feedback submitted successfully!';
        this.feedbackForm.reset({ categoryId: '' });
        this.selectedFile = null;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to submit feedback. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
