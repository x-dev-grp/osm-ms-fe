import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';

export function roleGuard(requiredRole: string): CanActivateFn {
  return () => {
    const authService = inject(AuthenticationService);
    const router = inject(Router);

    if (authService.hasRole(requiredRole) || authService.isAdmin()) {
      return true;
    }

    authService.logout();
    return false;
  };
}
