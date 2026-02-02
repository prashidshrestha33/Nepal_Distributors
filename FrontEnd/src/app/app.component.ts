import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { InactivityService } from './shared/services/inactivity.service';
import { AuthService } from './shared/services/auth.service';
import { NotificationService } from '../app/shared/services/notification.service';
import { filter } from 'rxjs/operators';

@Component({
  selector:  'app-root',
  standalone: true,
  imports:  [
    RouterModule,
  ],
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
    private notificationService: NotificationService  // 🔥 Added
  ) {}

  ngOnInit() {
    // 🔥 Initialize Firebase notifications listener
    this.notificationService. listenForMessages();
    this.checkNotificationStatus() 
    if (this.authService.isAuthenticated()) {
      this.requestNotificationPermission();
    }
    if (this.authService.isAuthenticated()) {
      this.inactivityService.initInactivityTimer();
    }

    // Listen for route changes to manage inactivity timer
    this. router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe((event: any) => {
        // Check if user is authenticated after navigation
        if (this.authService.isAuthenticated()) {
          // Reset inactivity timer on every navigation
          this.inactivityService.resetInactivityTimer();
        } else {
          // Stop inactivity timer if user is not authenticated
          this.inactivityService.stopInactivityTimer();
        }
      });
  }

  // ✅ Check if notifications are already allowed
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

  // 🔥 Request notification permission
  private async requestNotificationPermission() {
    try {
      const token = await this.notificationService. requestPermission();
      if (token) {
      }
    } catch (error) {
    }
  }

  // 🔥 Public method to manually enable notifications (optional - call from UI)
  async enableNotifications() {
    const token = await this.notificationService.requestPermission();
    if (token) {
      alert('Notifications enabled successfully!');
      
      return token;
    } else {
      return null;
    }this.checkNotificationStatus();
  }

  ngOnDestroy() {
    // Clean up inactivity timer when app is destroyed
    this.inactivityService.stopInactivityTimer();
  }
}