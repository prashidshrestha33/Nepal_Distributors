import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FeedbackService, Feedback } from '../../../../services/feedback.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-feedback-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feedback-details.component.html'
})
export class FeedbackDetailsComponent implements OnInit {
  feedback: Feedback | null = null;
  loading = true;
  apiBaseUrl = environment.apiBaseUrl;

  constructor(
    private route: ActivatedRoute,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadFeedback(+id);
      }
    });
  }

  loadFeedback(id: number) {
    this.loading = true;
    this.feedbackService.getFeedbackById(id).subscribe({
      next: (res: any) => {
        this.feedback = res.result || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading feedback details', err);
        this.loading = false;
      }
    });
  }

  getImageUrl(fileName: string): string {
    return `${this.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(fileName)}&path=FeedbackFiles`;
  }
}
