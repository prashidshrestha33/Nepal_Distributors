import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { InactivityService } from './shared/services/inactivity.service';
import { AuthService } from './shared/services/auth.service';
import { NotificationService } from '../app/shared/services/notification.service';
import { BreadcrumbService, Breadcrumb } from './shared/services/breadcrumb.service';
import { NavigationHistoryService } from './shared/services/navigation-history.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {

  title = 'Nepal Distributors';
  notificationsEnabled = false;

  // ✅ breadcrumb array
  breadcrumbs: Breadcrumb[] = [];

  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
    private breadcrumbService: BreadcrumbService,
    public navHistory: NavigationHistoryService
  ) {}

  ngOnInit() {

    // 🔥 Firebase listener
    this.notificationService.listenForMessages();
    this.checkNotificationStatus();

    if (this.authService.isAuthenticated()) {
      this.requestNotificationPermission();
      this.inactivityService.initInactivityTimer();
    }

    // ✅ Listen for route change (breadcrumb + inactivity)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {

        // 🔹 Build breadcrumbsthis.breadcrumbService.buildBreadCrumb(this.activatedRoute.snapshot.root);
this.breadcrumbService.buildBreadCrumb(this.activatedRoute.snapshot.root);


        // 🔹 Inactivity handling
        if (this.authService.isAuthenticated()) {
          this.inactivityService.resetInactivityTimer();
        } else {
          this.inactivityService.stopInactivityTimer();
        }
      });
  }

  // ✅ Back button click
  goBack() {
    this.navHistory.goBack();
  }

  // ================= NOTIFICATION =================

  private async checkNotificationStatus() {
    if (Notification.permission === 'granted') {
      this.notificationsEnabled = true;
      return;
    }
    if (Notification.permission === 'denied') {
      this.notificationsEnabled = false;
      return;
    }
  }

  private async requestNotificationPermission() {
    try {
      await this.notificationService.requestPermission();
    } catch (error) {}
  }

  async enableNotifications() {
    const token = await this.notificationService.requestPermission();
    if (token) {
      alert('Notifications enabled successfully!');
      return token;
    } else {
      return null;
    }
  }

  ngOnDestroy() {
    this.inactivityService.stopInactivityTimer();
  }
}
