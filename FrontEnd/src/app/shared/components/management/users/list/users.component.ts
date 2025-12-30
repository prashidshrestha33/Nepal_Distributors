import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/management/user.service';
import type { User } from '../../../../services/management/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  loading = false;
  error: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    console.log('Loading users...');
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        console.log('Users loaded:', data);
        this.users = data;
        this.filteredUsers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.error = 'Failed to load users. Please try again.';
        this.loading = false;
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.phone && user.phone.toLowerCase().includes(term))
    );
  }

  approveUser(id: number) {
    if (confirm('Are you sure you want to approve this user?')) {
      this.userService.approveUser(id).subscribe({
        next: () => {
          console.log('User approved successfully');
          this.error = null;
          this.loadUsers();
        },
        error: (err) => {
          console.error('Failed to approve user:', err);
          this.error = 'Failed to approve user. Please try again.';
        }
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          console.log('User deleted successfully');
          this.error = null;
          this.loadUsers();
        },
        error: (err) => {
          console.error('Failed to delete user:', err);
          this.error = 'Failed to delete user. Please try again.';
        }
      });
    }
  }
}
