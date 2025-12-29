import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  // List of endpoints that don't require JWT authentication
  private publicEndpoints = [
    '/api/StaticValue',  // Catalog endpoints - public
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Check if the request URL is a public endpoint
    const isPublicEndpoint = this.publicEndpoints.some(endpoint => 
      request.url.includes(endpoint)
    );

    // Get JWT token from storage
    const token = this.authService.getToken();

    console.log('=== JWT Interceptor Debug ===');
    console.log('Request URL:', request.url);
    console.log('Is Public Endpoint:', isPublicEndpoint);
    console.log('Token Available:', !!token);
    console.log('Token Value:', token ? token.substring(0, 20) + '...' : 'null');

    // Clone the request and add Authorization header only if:
    // 1. Token exists AND
    // 2. The endpoint is NOT in the public endpoints list
    if (token && !isPublicEndpoint) {
      console.log('✓ Adding JWT token to request:', request.url);
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else if (!isPublicEndpoint && !token) {
      console.log('✗ No token found for protected endpoint:', request.url);
    } else if (isPublicEndpoint) {
      console.log('→ Public endpoint - no auth header added:', request.url);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('HTTP Error:', error.status, error.message);
        
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          // Token is invalid or expired
          console.error('Unauthorized request - Token invalid or expired');
          this.authService.logout();
          this.router.navigate(['/signin']);
        }

        // Handle 403 Forbidden responses
        if (error.status === 403) {
          console.error('Forbidden - Access denied');
          this.router.navigate(['/signin']);
        }

        return throwError(() => error);
      })
    );
  }
}
