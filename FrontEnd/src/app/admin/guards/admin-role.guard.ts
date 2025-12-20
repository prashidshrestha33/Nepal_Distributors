import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminRoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        // Check if user has admin role
        if (user && (user.role === 'admin' || user.role === 'ADMIN')) {
          return true;
        }

        // If not admin, redirect to unauthorized page or home
        console.warn('Access denied: Admin role required');
        this.router.navigate(['/unauthorized']);
        return false;
      })
    );
  }
}

/**
 * Guard for specific module access
 * Can be extended to restrict access to specific modules based on permissions
 */
@Injectable({
  providedIn: 'root'
})
export class ModuleAccessGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredModule = route.data['requiredModule'];
    
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user) {
          return false;
        }

        // Check if user is admin (has access to all modules)
        if (user.role === 'admin' || user.role === 'ADMIN') {
          return true;
        }

        // Check if user has specific module permission
        const userPermissions = user.permissions || [];
        if (requiredModule && !userPermissions.includes(requiredModule)) {
          console.warn(`Access denied: ${requiredModule} permission required`);
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

/**
 * Guard for approval authority
 * Only users with approval authority can approve/reject items
 */
@Injectable({
  providedIn: 'root'
})
export class ApprovalAuthorityGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        // Check if user has approval authority
        if (user && (user.role === 'admin' || user.role === 'ADMIN' || user.canApprove)) {
          return true;
        }

        console.warn('Access denied: Approval authority required');
        this.router.navigate(['/unauthorized']);
        return false;
      })
    );
  }
}
