import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthenticationService } from '../../auth/services/authentication.service';
import { Role } from '../../theme/types/role';

export const AdminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const user = authenticationService.currentUserValue;

  return user?.role === Role.OsmAdmin
    ? true
    : router.createUrlTree(['/access-denied']);
};
