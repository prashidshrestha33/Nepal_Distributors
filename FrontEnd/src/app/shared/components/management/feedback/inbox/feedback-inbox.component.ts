import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FeedbackService, Feedback } from '../../../../services/feedback.service';

@Component({
  selector: 'app-feedback-inbox',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feedback-inbox.component.html'
})
export class FeedbackInboxComponent implements OnInit {
  feedbacks: Feedback[] = [];
  loading = false;

  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks() {
    this.loading = true;
    this.feedbackService.getFeedbacks().subscribe({
      next: (res: any) => {
        this.feedbacks = res.result || res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading feedbacks:', err);
        this.loading = false;
      }
    });
  }
}
