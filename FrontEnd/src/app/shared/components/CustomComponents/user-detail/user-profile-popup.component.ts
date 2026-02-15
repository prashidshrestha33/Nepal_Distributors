import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../../ui.service';
import { User, UserService } from '../../../services/management/user.service';

@Component({
  selector: 'app-user-profile-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile-popup.component.html',
  styleUrls: ['./user-profile-popup.component.css']
})
export class UserProfilePopupComponent implements OnInit {

  @Input() userId!: number;
  @Output() close = new EventEmitter<void>();

  user?: User;
  editMode = false;
  loading = true;
  uploading = false;

  constructor(
    private userService: UserService,
    private ui: UiService
  ) {}

  ngOnInit(): void {
    if (this.userId) {
      this.loaduser();
    }
  }

  // ✅ Load User
   loaduser(): void {
    this.loading = true;
    this.userService.getById(this.userId).subscribe({
      next: res => {
        this.user = { ...res };
        debugger;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.ui.showStatus('Failed to load user profile', 'error');
      }
    });
  }
 save() {
  if (!this.user) return;

  const payload = {
    Id: this.userId,
    FullName: this.user.fullName ?? '',
    Email: this.user.email ?? '',
    Phone: this.user.phone ?? ''
  };

  this.uploading = true;

  this.userService.updateuser(payload).subscribe({
    next: () => {
      this.uploading = false;
      this.ui.showStatus('User updated successfully', 'success');
      this.editMode = false;
      this.loaduser();
    },
    error: (err) => {
      this.uploading = false;
      console.error(err);
      this.ui.showStatus('Update failed', 'error');
    }
  });
}


  cancelEdit(): void {
    this.editMode = false;
    this.loaduser();
  }

  closePopup(): void {
    this.close.emit();
  }
}
