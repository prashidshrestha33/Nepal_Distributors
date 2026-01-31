import { Component } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

// Layout components
import { AppSidebarComponent } from '../app-sidebar/app-sidebar.component';
import { BackdropComponent } from '../backdrop/backdrop.component';
import { AppHeaderComponent } from '../app-header/app-header.component';

// Custom popups
import { OtpPopupComponent } from '../../components/CustomComponents/otp-popup/otp-popup.component';
import { ImageViewerComponent } from '../../components/CustomComponents/image-viewer/image-viewer.component';
import { StatusPopupComponent } from '../../components/CustomComponents/status-popup/status-popup.component';

// Global UI service
import { UiService, StatusPopupState } from '../../../ui.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AppHeaderComponent,
    AppSidebarComponent,
    BackdropComponent,
    OtpPopupComponent,
    ImageViewerComponent,
    StatusPopupComponent
  ],
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.css']
})
export class AppLayoutComponent {
  readonly isExpanded$: Observable<boolean>;
  readonly isHovered$: Observable<boolean>;
  readonly isMobileOpen$: Observable<boolean>;

  // Popups
  showOtp$: Observable<boolean>;
  showImage$: Observable<{ url: string } | null>;
  showStatus$: Observable<StatusPopupState | null>;

  constructor(
    public sidebarService: SidebarService,
    public ui: UiService // inject global UI service
  ) {
    // Sidebar observables
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isHovered$ = this.sidebarService.isHovered$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;

    // Initialize popup observables
    this.showOtp$ = this.ui.showOtp$;
    this.showImage$ = this.ui.showImage$;
    this.showStatus$ = this.ui.showStatus$;
  }

  get containerClasses(): string[] {
    return [
      'flex-1',
      'transition-all',
      'duration-300',
      'ease-in-out',
      (this.isExpanded$ || this.isHovered$) ? 'xl:ml-[290px]' : 'xl:ml-[90px]',
      this.isMobileOpen$ ? 'ml-0' : ''
    ];
  }

  // Helper methods to open popups
  openOtp(): void {
    this.ui.openOtp();
  }

  openImage(url: string): void {
    this.ui.openImage(url);
  }

  showStatus(message: string, type: 'success' | 'error'): void {
    this.ui.showStatus(message, type);
  }
}
