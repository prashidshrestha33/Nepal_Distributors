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
    // Check if token exists in localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Check if token is valid and not expired
    if (token && this.authService.isAuthenticated()) {
      return true;
    }

    // No valid token or token expired, redirect to signin and return false
    this.router.navigate(['/signin'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

