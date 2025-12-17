import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { InactivityService } from './shared/services/inactivity.service';
import { AuthService } from './shared/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
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
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize inactivity timer if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.inactivityService.initInactivityTimer();
    }

    // Listen for route changes to manage inactivity timer
    this.router.events
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

  ngOnDestroy() {
    // Clean up inactivity timer when app is destroyed
    this.inactivityService.stopInactivityTimer();
  }
}

