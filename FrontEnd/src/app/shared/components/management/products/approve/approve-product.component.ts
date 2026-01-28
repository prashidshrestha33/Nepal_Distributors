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
  /** Product to approve or reject */
  @Input() product: (Product & { categoryName?: string; brandName?: string }) | null = null;

  /** Event emitted when product is approved or rejected */
  @Output() approve = new EventEmitter<{ status: 'Approved' | 'Rejected'; reason?: string }>();

  /** Event emitted when modal is cancelled */
  @Output() cancel = new EventEmitter<void>();

  /** Modal visibility flags */
  showReasonModal = false;
  showApproveModal = false;
  showApproveModal1 = false;

  /** Whether the current action is rejection */
  isReject = false;

  /** Current action type */
  actionType: 'Approved' | 'Rejected' | null = null;

  /** Reason for rejection or optional note for approval */
  reason = '';

  /** Approval dropdown selection (if needed) */
  approvalType: string = '';

  /** Selected company ID (optional, can remove if unused) */
  selectedCompanyId: number | null = null;

  /**
   * Open the reason modal for approval or rejection
   */
  openReason(action: 'Approved' | 'Rejected') {
    this.actionType = action;
    this.reason = '';
    this.showReasonModal = true;
  }

  /**
   * Open the approve/reject modal (step 1)
   * @param fg 'a' for approve, anything else for reject
   */
  openApproveStep1Modal(fg: string) {
    this.isReject = fg !== 'a';
    this.showApproveModal = false;
    this.showApproveModal1 = true;
  }

  /** Close approve/reject modal */
  closeApproveModal() {
    this.showApproveModal = false;
    this.showApproveModal1 = false;
    this.selectedCompanyId = null;
    this.approvalType = '';
    this.reason = '';
  }

  /** Confirm action from reason modal */
  confirmAction(reason: string, actionType: 'Approved' | 'Rejected') {
    if (actionType === 'Rejected' && !reason.trim()) return;
    // If you need to check approvalType for 'Approved', add logic here, otherwise just use reason
    this.approve.emit({
      status: actionType,
      reason: reason
    });
    this.closeReason();
  }

  /** Close reason modal */
  closeReason() {
    this.showReasonModal = false;
    this.actionType = null;
    this.reason = '';
    this.approvalType = '';
  }

  /** Emit cancel event */
  onCancel() {
    this.cancel.emit();
  }
}
