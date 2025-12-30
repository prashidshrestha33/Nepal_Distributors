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
   * Decode JWT token to extract claims
   * @param token The JWT token to decode
   * @returns Decoded token payload
   */
  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode the payload (second part)
      const payload = parts[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if JWT token is expired by examining its exp claim
   * @param token The JWT token to check
   * @returns True if token is expired, false otherwise
   */
  private isJwtExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true; // Invalid token, treat as expired
      }

      // exp is in seconds, convert to milliseconds and compare with current time
      const expirationTime = decoded.exp * 1000;
      const currentTime = new Date().getTime();

      return currentTime > expirationTime;
    } catch (error) {
      console.error('Error checking JWT expiration:', error);
      return true; // Treat as expired on error
    }
  }

  /**
   * Save token to localStorage or sessionStorage based on rememberMe flag
   * @param token The authentication token
   * @param rememberMe If true, save to localStorage (persistent); if false, save to sessionStorage (session-only)
   */
  saveToken(token?: string, rememberMe: boolean = false): void {
    if (token) {
      console.log('Saving token to', rememberMe ? 'localStorage' : 'sessionStorage');
      if (rememberMe) {
        localStorage.setItem('token', token);
        sessionStorage.removeItem('token');
        console.log('✓ Token saved to localStorage');
      } else {
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token');
        console.log('✓ Token saved to sessionStorage');
      }
      // Verify token was saved
      const savedToken = this.getToken();
      console.log('Token verification - retrieved:', !!savedToken);
    }
  }

  /**
   * Get token from localStorage or sessionStorage
   * Checks both storages with fallback mechanism
   */
  getToken(): string | null {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('AuthService.getToken():', token ? 'Token found (' + token.substring(0, 20) + '...)' : 'No token found');
    return token;
  }

  /**
   * Check if token is expired by checking JWT exp claim
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    // Use JWT expiration claim
    return this.isJwtExpired(token);
  }

  /**
   * Validate JWT token format and expiration
   * @param token The JWT token to validate
   * @returns True if token is valid, false otherwise
   */
  isTokenValid(token: string): boolean {
    if (!token) return false;

    // Check token format (should have 3 parts separated by dots)
    if (token.split('.').length !== 3) {
      return false;
    }

    // Check if token is expired
    return !this.isJwtExpired(token);
  }

  /**
   * Check if user is authenticated
   * Verifies token exists, is not empty, is not expired, and is valid
   */
  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token || token.length === 0) {
      return false;
    }

    // Check stored expiry time
    if (this.isTokenExpired()) {
      // Auto-logout if token is expired
      this.logout();
      return false;
    }

    // Validate JWT token format and expiration claims
    if (!this.isTokenValid(token)) {
      // Auto-logout if token is invalid
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Get user claims from JWT token
   * @returns Decoded token claims or null if invalid
   */
  getTokenClaims(): any {
    const token = this.getToken();
    if (!token) return null;

    return this.decodeToken(token);
  }

  /**
   * Login user with email and password
   * @param email User email
   * @param password User password
   * @param rememberMe If true, remember user for future sessions
   */
  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.api}/api/auth/login`, { email, password }, { headers })
      .pipe(
        tap(res => {
          // Backend returns token inside result object: { result: { token: '...' } }
          const token = res?.result?.token || res?.token;
          console.log('Login response received. Token found:', !!token);
          if (token) {
            console.log('Saving token to storage. RememberMe:', rememberMe);
            this.saveToken(token, rememberMe);
            console.log('Token saved successfully');
          }
        })
      );
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
    sessionStorage.removeItem('token');
    
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
