import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Product } from '../../../../services/management/management.service';

@Component({
  selector: 'app-approve-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approve-product.component.html',
  styleUrls: ['./approve-product.component.css']
})
export class ApproveProductComponent {

  // =========================
  // Snackbar for notifications
  // =========================
  snackbar = {
    show: false,
    message: '',
    success: true
  };

  private snackbarTimeout?: any;

  /** Show snackbar with success or error */
  showSnackbar(message: string, success: boolean = true, duration: number = 5000) {
    // Clear any existing timeout
    if (this.snackbarTimeout) clearTimeout(this.snackbarTimeout);

    this.snackbar.message = message;
    this.snackbar.success = success;
    this.snackbar.show = true;

    this.snackbarTimeout = setTimeout(() => {
      this.snackbar.show = false;
    }, duration);
  }

  // =========================
  // Inputs & Outputs
  // =========================
  @Input() product: (Product & { categoryName?: string; brandName?: string }) | null = null;

  /** Emits when product is approved or rejected */
  @Output() approve = new EventEmitter<{ status: 'Approved' | 'Rejected'; reason?: string }>();

  /** Emits when modal is cancelled */
  @Output() cancel = new EventEmitter<void>();

  // =========================
  // Modal state
  // =========================
  showReasonModal = false;
  actionType: 'Approved' | 'Rejected' | null = null; // Current action
  reason = '';                   // Reason for rejection or optional note
  isReject = false;              // Flag to indicate rejection

  // =========================
  // Methods
  // =========================

  /** Open reason modal for approval or rejection */
  openReason(action: 'Approved' | 'Rejected') {
    this.actionType = action;
    this.reason = '';
    this.showReasonModal = true;
  }

  /** Close reason modal */
  closeReason() {
    this.showReasonModal = false;
    this.actionType = null;
    this.reason = '';
  }

  /** Confirm approval or rejection action */
  confirmAction(reason: string, actionType: 'Approved' | 'Rejected') {
    if (actionType === 'Rejected' && !reason.trim()) {
      this.showSnackbar('Reason is required for rejection.', false);
      return;
    }

    // Show snackbar immediately
    const msg = actionType === 'Approved'
      ? 'Product approved successfully!'
      : 'Product rejected.';
    this.showSnackbar(msg, actionType === 'Approved');

    // Emit event to parent component after a short delay to show snackbar
    setTimeout(() => {
      this.approve.emit({
        status: actionType,
        reason
      });
      this.closeReason();
    }, 500);
  }

  /** Cancel modal */
  onCancel() {
    this.cancel.emit();
  }
}
