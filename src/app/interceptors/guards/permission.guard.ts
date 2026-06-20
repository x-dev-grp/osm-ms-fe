import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';

export function allPermissionGuard(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const authService = inject(AuthenticationService);
    if (authService.hasAllPermissions(requiredPermissions) || authService.isAdmin()) {
      return true;
    }
    return router.createUrlTree(['/access-denied']);
  };
}
export function anyPermissionGuard(requiredPermissions: string[]): CanActivateFn {
  return () => {
    // CHANGE: permissions - use hasAnyPermission and standardize deny to 403 redirect
    const router = inject(Router);
    const authService = inject(AuthenticationService);
    if (authService.hasAnyPermission(requiredPermissions) || authService.isAdmin()) {
      return true;
    }
    return router.createUrlTree(['/access-denied']);
  };
}
export function moduleGuard(modules: string[]): CanActivateFn {
  return () => {
    // CHANGE: permissions - use hasAnyPermission and standardize deny to 403 redirect
    const router = inject(Router);
    const authService = inject(AuthenticationService);
    if (authService.hasAnyModule(modules) || authService.isAdmin()) {
      return true;
    }
    return router.createUrlTree(['/access-denied']);
  };
}
