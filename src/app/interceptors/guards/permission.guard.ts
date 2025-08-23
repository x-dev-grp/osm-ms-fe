import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthenticationService } from "src/app/auth/services/authentication.service";

export function allPermissionGuard(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const authService = inject(AuthenticationService);
    if (authService.hasAllPermissions(requiredPermissions) || authService.isAdmin()) {
      return true;
    }
    // authService.logout() ;
    // return false;
    // Redirige vers une page 403 dédiée au lieu de déconnecter l'utilisateur
    return router.createUrlTree(
      ['/access-denied']);
  };
}
export function anyPermissionGuard(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthenticationService);
    if (authService.hasAllPermissions(requiredPermissions) || authService.isAdmin()) {
      return true;
    }
    authService.logout() ;
    return false;
  };
}
