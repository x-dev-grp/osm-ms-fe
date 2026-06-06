import { Injectable, inject } from '@angular/core';
import { Router, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, CanActivateFn } from '@angular/router';

import { AuthenticationService } from '../../auth/services/authentication.service';
import { TokenService } from 'src/app/auth/services/tokenService.service';

export const AuthGuardPassword : CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const _tokenService=inject(TokenService)

  
    const token = _tokenService.getToken();
    const currentUser = authenticationService.currentUserValue;
    if(token ){
      if(currentUser ){
        if(currentUser?.isLocked){
          authenticationService.logout("locked");
          return false;
        }
       
      }
      return true;
    }
    authenticationService.logout();
    return false;
  
};
