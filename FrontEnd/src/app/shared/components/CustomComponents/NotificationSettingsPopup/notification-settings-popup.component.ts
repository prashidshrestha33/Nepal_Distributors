import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../../../services/management/company.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-notification-settings-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-settings-popup.component.html',
  styleUrls: ['./notification-settings-popup.component.css']
})
export class NotificationSettingsPopupComponent implements OnInit {
  @Input() companyId!: number;
  @Output() close = new EventEmitter<void>();

  loading = true;
  saving = false;
  
  settings: any = {
    notifyFg: false,
    categories: []
  };

  constructor(private mgtService: CompanyService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.mgtService.getNotificationSettings(this.companyId).subscribe({
      next: (res) => {
        if(res.data) this.settings = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  saveSettings() {
    this.saving = true;
    const payload = {
      companyId: this.companyId,
      notifyFg: this.settings.notifyFg,
      categories: this.settings.categories
    };

    this.mgtService.updateNotificationSettings(payload).subscribe({
      next: () => {
        this.saving = false;
        this.closePopup();
      },
      error: () => {
        alert("Failed to save.");
        this.saving = false;
      }
    });
  }

  closePopup() {
    this.close.emit();
  }

  getImageUrl(imageName?: string): string {
    return imageName ? `${environment.apiBaseUrl}/api/CompanyFile?fileName=${encodeURIComponent(imageName)}` : 'assets/images/no-image.png';
  }
}
