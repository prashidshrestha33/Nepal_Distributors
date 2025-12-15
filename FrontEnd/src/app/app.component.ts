import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InactivityService } from './shared/services/inactivity.service';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Nepal Distributors';

  constructor(
    private inactivityService: InactivityService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize inactivity timer if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.inactivityService.initInactivityTimer();
    }
  }
}

