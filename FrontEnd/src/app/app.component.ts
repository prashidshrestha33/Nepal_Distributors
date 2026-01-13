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

  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService  // 🔥 Added
  ) {}

  ngOnInit() {
    // 🔥 Initialize Firebase notifications listener
    this.notificationService. listenForMessages();
    console.log('🔥 Firebase notifications initialized');

    // 🔥 Auto-request notification permission if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.requestNotificationPermission();
    }

    // Initialize inactivity timer if user is authenticated
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

  // 🔥 Request notification permission
  private async requestNotificationPermission() {
    try {
      const token = await this.notificationService. requestPermission();
      if (token) {
        console.log('✅ FCM Token obtained:', token);
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
    }
  }

  // 🔥 Public method to manually enable notifications (optional - call from UI)
  async enableNotifications() {
    const token = await this.notificationService.requestPermission();
    if (token) {
      alert('✅ Notifications enabled successfully!');
      return token;
    } else {
      alert('❌ Please allow notifications in your browser settings.');
      return null;
    }
  }

  ngOnDestroy() {
    // Clean up inactivity timer when app is destroyed
    this.inactivityService.stopInactivityTimer();
  }
}