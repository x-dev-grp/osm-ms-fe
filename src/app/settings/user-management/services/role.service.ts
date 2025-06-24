import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "src/app/@theme/types/user";
import { Role } from "src/app/shared/models/security/role.model";
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
    _http=inject(HttpClient);
    private baseUrl = environment.apiUrl  + '/api/security/role';
    addRole(role: Role): Observable<any> {
      return this._http.post<User>(`${this.baseUrl}`,role);
    }
    fetchAll(): Observable<any> {
      return this._http.get<User>(`${this.baseUrl}/all-with-user-count`);
    }
    fetchById(id:string):Observable<any>{
      return this._http.get(`${this.baseUrl}/fetch/${id}`);
    }
}
