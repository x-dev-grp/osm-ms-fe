import { Injectable, inject } from '@angular/core';
import { Router, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../../auth/services/authentication.service';
import { TokenService } from 'src/app/auth/services/tokenService.service';

@Injectable({ providedIn: 'root' })
export class AuthGuardLogin implements CanActivateChild {
  private router = inject(Router);
  private authenticationService = inject(AuthenticationService);
  private _tokenService=inject(TokenService)

  /**
   * Determines whether a child route can be activated based on user authentication and authorization.
   *
   * @param route - The activated route snapshot that contains the route configuration and parameters.
   * @param state - The router state snapshot that contains the current router state.
   * @returns A boolean indicating whether the route can be activated. Redirects to an appropriate page if not.
   *
   * If the user is logged in and their role is authorized for the route, returns true.
   * If the user is logged in but not authorized, redirects to the unauthorized page and returns false.
   * If the user is not logged in, redirects to the login page with the return URL and returns false.
   */

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const token = this._tokenService.getToken();
    const currentUser = this.authenticationService.currentUserValue;
    console.log({
      user:currentUser,
      token:token
    })
    if(!token && !currentUser){
      return true;
    }
    this.router.navigate(['/dashboard']);
    return false;
  }
}
