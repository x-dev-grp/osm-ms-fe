import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthenticationService } from '../../auth/services/authentication.service';
import { TokenService } from 'src/app/auth/services/tokenService.service';
import { Role } from '../../theme/types/role';

export const AuthGuardLogin: CanActivateFn = () => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const tokenService = inject(TokenService);

  const token = tokenService.getToken();
  const currentUser = authenticationService.currentUserValue;

  if (!token && !currentUser) {
    return true;
  }

  if (currentUser?.isNewUser) {
    return router.createUrlTree(['/auth/user/update-password']);
  }

  return router.createUrlTree([currentUser?.role === Role.OsmAdmin ? '/administration/dashboard' : '/welcome']);
};
