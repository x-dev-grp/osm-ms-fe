import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AuthenticationService } from '../../auth/services/authentication.service';

export const AdminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const user = authenticationService.currentUserValue;

   if (user && user.role === 'OSMADMIN') {
    return true;
  }
  router.navigate(['/not-authorized']);
  return false;
};
