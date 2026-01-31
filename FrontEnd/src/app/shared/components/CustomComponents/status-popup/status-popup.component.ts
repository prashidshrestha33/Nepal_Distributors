import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusPopupState } from '../../../../ui.service';

@Component({
  selector: 'app-status-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-popup.component.html',
  styleUrls: ['./status-popup.component.css']
})
export class StatusPopupComponent {
  @Input() state!: StatusPopupState | null;  // receive observable state
  @Output() close = new EventEmitter<void>();

  // helper getters for template
  get message(): string {
    return this.state?.message || '';
  }

  get success(): boolean {
    return this.state?.type === 'success';
  }

  closePopup() {
    this.close.emit();
  }
}
