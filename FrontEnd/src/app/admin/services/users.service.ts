import { Injectable } from '@angular/core';
import { BaseApiService, PaginatedResponse, PaginationParams } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  role: string;
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService extends BaseApiService {
  private endpoint = '/api/users';

  constructor(http: HttpClient) {
    super(http);
  }

  getUsers(params?: PaginationParams): Observable<PaginatedResponse<User>> {
    return this.getList<User>(this.endpoint, params);
  }

  getUser(id: number): Observable<User> {
    return this.getById<User>(this.endpoint, id);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.create<User>(this.endpoint, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.update<User>(this.endpoint, id, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.delete(this.endpoint, id);
  }

  approveUser(id: number): Observable<User> {
    return this.approve<User>(this.endpoint, id);
  }

  rejectUser(id: number, reason?: string): Observable<User> {
    return this.reject<User>(this.endpoint, id, reason);
  }
}
