import { Component, OnInit } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';
import { UiService } from '../../../../../app/ui.service';
@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  userName: string = 'Guest';
  userEmail: string = 'guest@example.com';
  userInitials: string = 'G';
   catalogId: number | null = null;
     UserId: number | null = null;

  constructor(
    private authService: AuthService,
    private inactivityService: InactivityService,
    private ui: UiService
  ) {
    this.loadUserData();
  }

  ngOnInit() {
      const tokenString  = localStorage.getItem('userClaims') || sessionStorage.getItem('userClaims');
  
       if(tokenString)
      {
             const token = JSON.parse(tokenString); 
             this.catalogId = +token.company_id;
             this.UserId=+token.Userid;
             
      }
    this.loadUserData();
  }

  loadUserData() {
    try {
      const claims = this.authService.getTokenClaims();
      if (claims) {
        // Extract user data from JWT claims
        // Adjust these fields based on what your backend returns in the JWT
        this.userName = claims.name || claims.fullName || claims.email?.split('@')[0] || 'User';
        this.userEmail = claims.email || 'No email';
        
        // Generate initials from name
        const names = this.userName.split(' ');
        this.userInitials = names.map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
  OnComopneyProfileClick() {
   this.ui.openCompanyProfile(this.catalogId||0);
  }
  OnUserProfileClick() {
   this.ui.openUserProfile(this.UserId||0);
  }

  closeDropdown() {
    this.isOpen = false;
  }

  logout() {
    // Stop inactivity tracking before logout
    this.inactivityService.stopInactivityTimer();

    // Call logout from auth service which handles:
    // 1. Remove token from localStorage and sessionStorage
    // 2. Navigate to /signin with replaceUrl: true
    // 3. Prevent back button access
    this.authService.logout();
  }
}
