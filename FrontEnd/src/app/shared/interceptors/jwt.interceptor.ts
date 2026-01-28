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

    // Clone the request and add Authorization header only if:
    // 1. Token exists AND
    // 2. The endpoint is NOT in the public endpoints list
    if (token && !isPublicEndpoint) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else if (!isPublicEndpoint && !token) {
    } else if (isPublicEndpoint) {
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        
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
