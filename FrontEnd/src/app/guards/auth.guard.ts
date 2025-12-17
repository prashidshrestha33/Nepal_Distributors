import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    // Get token from storage
    const token = this.authService.getToken();

    // If no token exists, deny access
    if (!token) {
      console.warn('Access denied: No token found. Redirecting to signin.');
      return this.router.createUrlTree(['/signin'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Token exists, validate it
    if (this.authService.isAuthenticated()) {
      // Token is valid and not expired
      return true;
    }

    // Token exists but is invalid or expired
    console.warn('Access denied: Token invalid or expired. Redirecting to signin.');
    this.authService.logout();
    
    return this.router.createUrlTree(['/signin'], {
      queryParams: { returnUrl: state.url }
    });
  }
}

