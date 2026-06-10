import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { InactivityService } from './shared/services/inactivity.service';
import { AuthService } from './shared/services/auth.service';
import { NotificationService } from '../app/shared/services/notification.service';
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


  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
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



        // 🔹 Inactivity handling
        if (this.authService.isAuthenticated()) {
          this.inactivityService.resetInactivityTimer();
        } else {
          this.inactivityService.stopInactivityTimer();
        }
      });
  }


  // ================= NOTIFICATION =================

  private shouldRegisterFcm(): boolean {
    try {
      const claimsStr = localStorage.getItem('userClaims') || sessionStorage.getItem('userClaims');
      if (!claimsStr) return true;
      const claims = JSON.parse(claimsStr);
      
      const noFmcClaim = claims.no_fmc === 'y';
      const tokenSet = localStorage.getItem('fcmToken_set');
      
      return noFmcClaim || !tokenSet;
    } catch (e) {
      return true;
    }
  }

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
      if (this.shouldRegisterFcm()) {
        await this.notificationService.requestPermission();
      }
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
