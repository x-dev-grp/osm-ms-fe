import {  inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, CanActivateFn } from '@angular/router';

import { AuthenticationService } from '../../auth/services/authentication.service';
import { TokenService } from 'src/app/auth/services/tokenService.service';

export const AuthGuardLogin: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const tokenService = inject(TokenService);

  const token = tokenService.getToken();
  const currentUser = authenticationService.currentUserValue;

  console.log({ user: currentUser, token });

  if (!token && !currentUser) {
    return true;
  }

  if (currentUser?.isNewUser) {
    router.navigate(['/auth/user/update-password']);
    return false;
  }

  router.navigate(['/dashboard']);
  return false;
};
