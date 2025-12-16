import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = environment.apiBaseUrl; // base API URL from environment
  private TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Save token to localStorage or sessionStorage based on rememberMe flag
   * @param token The authentication token
   * @param rememberMe If true, save to localStorage (persistent); if false, save to sessionStorage (session-only)
   */
  saveToken(token?: string, rememberMe: boolean = false): void {
    if (token) {
      const expiryTime = new Date().getTime() + this.TOKEN_EXPIRY_TIME;

      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiry', expiryTime.toString());
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('tokenExpiry');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('tokenExpiry', expiryTime.toString());
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
      }
    }
  }

  /**
   * Get token from localStorage or sessionStorage
   * Checks both storages with fallback mechanism
   */
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const expiryTime = localStorage.getItem('tokenExpiry') || sessionStorage.getItem('tokenExpiry');
    if (!expiryTime) return false;

    const currentTime = new Date().getTime();
    return currentTime > parseInt(expiryTime);
  }

  /**
   * Check if user is authenticated
   * Verifies token exists, is not empty, and is not expired
   */
  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token || token.length === 0) {
      return false;
    }

    if (this.isTokenExpired()) {
      // Auto-logout if token is expired
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Login user with email and password
   * @param email User email
   * @param password User password
   * @param rememberMe If true, remember user for future sessions
   */
  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.api}/api/auth/login`, { email, password }, { headers });
  }

  /**
   * Sign up new user
   * @param userData User registration data
   */
  signup(userData: any): Observable<any> {
    return this.http.post<any>(`${this.api}/api/auth/signup`, userData)
      .pipe(
        tap(res => {
          if (res?.token) {
            this.saveToken(res.token, true); // Auto-login after signup
          }
        })
      );
  }

  /**
   * Register company (step 1) - multipart/form-data
   * Expects FormData containing Company.* fields and CompanyDocument file
   */
  
  registerStep1(formData: FormData): Observable<any> {
    // For multipart/form-data uploads we MUST NOT set the Content-Type header here.
    // The browser will set the correct Content-Type including the multipart boundary.
    // We do, however, want to explicitly accept JSON responses from the backend.
    const headers = new HttpHeaders({ Accept: 'application/json' });

    return this.http.post<any>(`${this.api}/api/auth/registernewuser`, formData, { headers });
  }

  /**
   * Create a company using multipart/form-data
   * Endpoint: POST /api/auth/companies
   * Returns an object containing `companyId` on success
   */
  createCompany(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<any>(`${this.api}/api/companies`, formData, { headers });
  }

  /**
   * Register user (step 2) - multipart/form-data
   * Expects FormData containing Register.* fields and Company.Id
   */
  registerStep2(formData: FormData): Observable<any> {
    // Step 2 is also a FormData multipart upload; do not set Content-Type.
    // Explicitly accept JSON so we consistently receive a JSON body from the API.
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.post<any>(`${this.api}/api/auth/registernewuser`, formData, { headers });
  }

  /**
   * Logout user
   * Removes token from both storages and redirects to signin page
   * Uses replaceUrl: true to clear browser history and prevent back button access
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tokenExpiry');
    
    // Navigate to signin with replaceUrl: true to clear browser history
    // This prevents users from using browser back button to access dashboard
    this.router.navigate(['/signin'], { replaceUrl: true });
  }

  /**
   * Get current user info (optional - implement based on backend)
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.api}/api/auth/me`);
  }

  /**
   * Check if email already exists in the system
   * @param email Email to check
   */
  checkEmailExists(email: string): Observable<any> {
    return this.http.get<any>(`${this.api}/api/auth/check-email`, {
      params: { email }
    });
  }
}
