import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import { AuthService } from '../../../services/auth.service';
import { InactivityService } from '../../../services/inactivity.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent {
  isOpen = false;

  constructor(
    private authService: AuthService,
    private inactivityService: InactivityService
  ) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
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
