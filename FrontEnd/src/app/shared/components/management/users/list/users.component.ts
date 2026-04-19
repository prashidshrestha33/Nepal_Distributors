import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../services/management/user.service';
import type { User } from '../../../../services/management/user.service';
import { UiService } from '../../../../../ui.service';

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
  catalogId: number | null = null;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private userService: UserService,
    private route: ActivatedRoute,
    private ui: UiService,
    private router: Router) {}

  ngOnInit() {
     this.route.queryParams.subscribe(params => {
      const id = params['companyId'];
      const tokenString  = localStorage.getItem('userClaims') || sessionStorage.getItem('userClaims');
  
      if (id) {
        this.catalogId = +id; 
        this.loadUsers();
      } 
      else if(tokenString)
      {
             const token = JSON.parse(tokenString); 
             this.catalogId = +token.company_id;
             
        this.loadUsers();
             
      }
        else {
     this.router.navigate(['/management/static-values-catalog']);
      }
  });
}

  loadUsers() {
    this.loading = true;
    this.userService.getUsers(this.catalogId||0).subscribe({
      next: (data: User[]) => {
        this.users = data;
        this.filteredUsers = data;
        this.applySort();
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
    this.currentPage = 1;
    this.applySort();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  applySort() {
    if (!this.sortColumn) {
      this.updatePagination();
      return;
    }

    this.filteredUsers.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (this.sortColumn) {
        case 'fullName':
          valA = (a.fullName || '').toLowerCase();
          valB = (b.fullName || '').toLowerCase();
          break;
        case 'email':
          valA = (a.email || '').toLowerCase();
          valB = (b.email || '').toLowerCase();
          break;
        case 'phone':
          valA = (a.phone || '').toLowerCase();
          valB = (b.phone || '').toLowerCase();
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  approveUser(id: number) {
    if (confirm('Are you sure you want to approve this user?')) {
      this.userService.approveUser(id).subscribe({
        next: () => {
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
  openRegisterUser() {
      
    this.ui.openRegisterLink(this.catalogId || 0);      
  }
}
