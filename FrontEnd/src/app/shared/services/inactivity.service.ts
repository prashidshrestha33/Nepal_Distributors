import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private inactivityTimer: any;
  private isInitialized = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  /**
   * Initialize inactivity timer on app load
   * Tracks user activity and auto-logs out after 30 minutes of inactivity
   */
  initInactivityTimer(): void {
    if (this.isInitialized) {
      return; // Already initialized
    }

    this.isInitialized = true;

    // Run outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      this.startInactivityTimer();

      // Track various user activity events
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

      activityEvents.forEach(event => {
        document.addEventListener(event, () => this.onUserActivity(), true);
      });
    });
  }

  /**
   * Called when user performs any activity
   * Resets the inactivity timer
   */
  private onUserActivity(): void {
    // Clear existing timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Start new timer
    this.startInactivityTimer();
  }

  /**
   * Start the inactivity countdown
   * If no activity is detected in 30 minutes, auto-logout
   */
  private startInactivityTimer(): void {
    this.inactivityTimer = setTimeout(() => {
      // Run inside Angular zone for navigation
      this.ngZone.run(() => {
        console.warn('User inactive for 30 minutes. Auto-logging out...');
        this.authService.logout();
      });
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Stop the inactivity timer
   * Called when user manually logs out or navigates away
   */
  stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.isInitialized = false;
  }

  /**
   * Reset the inactivity timer
   * Used when user manually navigates back to authenticated routes
   */
  resetInactivityTimer(): void {
    this.stopInactivityTimer();
    if (this.authService.isAuthenticated()) {
      this.initInactivityTimer();
    }
  }
}
