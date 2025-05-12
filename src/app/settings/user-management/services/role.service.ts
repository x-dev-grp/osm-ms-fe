import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "src/app/@theme/types/user";

@Injectable({
  providedIn: 'root',
})
export class RoleService {
    _http=inject(HttpClient);
    private baseUrl = '/api/security/role';
    addRole(role: any): Observable<any> {
      return this._http.post<User>(`${this.baseUrl}`,role);
    }
}