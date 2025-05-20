import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { User } from "src/app/@theme/types/user";
import { UserService } from "./user.service";
import { Observable } from "rxjs";
import { RoleService } from "./role.service";

@Injectable({ providedIn: 'root' })
export class RoleResolver implements Resolve<User> {
  constructor(private _service: RoleService) {}
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<User>|Promise<User>|User {
      return this._service.fetchById(route?.paramMap?.get('id')!);
    
  }
}