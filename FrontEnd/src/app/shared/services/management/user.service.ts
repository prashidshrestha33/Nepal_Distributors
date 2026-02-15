import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth.service';
import { ApiGatewayService } from '../api-gateway.service';
export interface User {
  id?: number;
  username?: string;
  email: string;
  fullName: string;
  full_name?: string; // Backend may send this
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt?: Date;
  created_at?: Date; // Backend may send this
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/api/Users`;

  constructor(private http: HttpClient, private authService: AuthService,
    private apiGateway: ApiGatewayService) {}

  getUsers(componeyid: number): Observable<User[]> {
    
    let request$: Observable<any>;
      request$ =this.apiGateway.getWithResult<User>(`${environment.apiBaseUrl}/api/Users/GetAll/${componeyid}`,
      { requiresAuth: true }
    );
    debugger;
    
    // Handle both array response and object response with data property
    return request$.pipe(
      map(response => {
        
        let users: any[] = [];
        
        // If response is already an array, use it
        if (Array.isArray(response)) {
          users = response;
        }
        // If response has a 'data' property, use that
        else if (response && response.data && Array.isArray(response.data)) {
          users = response.data;
        }
        // If response has a 'result' property with array, use that
        else if (response && response.result && Array.isArray(response.result)) {
          users = response.result;
        }
        // Fallback: return empty array if format is unexpected
        else {
          console.warn('Unexpected response format:', response);
          return [];
        }
        
        // Map snake_case properties to camelCase
        return users.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.full_name || user.name || '', // Support multiple field names
          phone: user.phone,
          status: user.status || 'inactive',
          createdAt: user.createdAt || user.created_at
        })) as User[];
      })
    );
  }


  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  approveUser(id: number): Observable<User> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<User>(
  `${this.apiUrl}/ApproveUser/${id}`,
  {},
  { headers }
).pipe(
  map(response => {
    return response;
  })
);

  }

  rejectUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
  }
    getById(id: number): Observable<User> {
      return this.getUserById(id);
    }
  
    updateuser(data: any) {
  return this.apiGateway.post(
    `${environment.apiBaseUrl}/api/Users/EditUser`,
    data, // JSON payload
    { requiresAuth: true }
  );
}

  getUserById(id: number): Observable<User> {
    return this.apiGateway.getWithResult<User>(`${environment.apiBaseUrl}/api/Users/${id}`,
      { requiresAuth: true }
    );
  }
}
