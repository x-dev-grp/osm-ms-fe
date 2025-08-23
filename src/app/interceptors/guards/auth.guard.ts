import {  inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, CanActivateFn } from '@angular/router';

import { AuthenticationService } from '../../auth/services/authentication.service';
import { TokenService } from 'src/app/auth/services/tokenService.service';

export const AuthGuardChild : CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const authenticationService = inject(AuthenticationService);
  const _tokenService=inject(TokenService)

 
    const token = _tokenService.getToken();
    const currentUser = authenticationService.currentUserValue;
    if(token ){
      if(currentUser ){
        if(currentUser?.isLocked){
          authenticationService.logout("locked");
         // this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
        if(currentUser?.isNewUser){
          router.navigate(['/auth/user/update-password']);
          return false;
        }
        // if(!currentUser?.role.includes("ADMIN")){
        //   this.router.navigate(['/unauthorized']);
        //   return false;
        // }
      }
      return true;
    }
    authenticationService.logout();
    return false;
  
};
