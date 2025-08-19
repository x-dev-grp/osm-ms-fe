import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthenticationService } from "src/app/auth/services/authentication.service";

export function allPermissionGuard(requiredPermissions: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthenticationService);
    if (authService.hasAllPermissions(requiredPermissions) || authService.isAdmin()) {
      return true;
    }
    authService.logout() ;
    return false;
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
