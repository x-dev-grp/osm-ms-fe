import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "src/app/@theme/types/user";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
    _http=inject(HttpClient);
    private baseUrl = environment.apiUrl + '/api/security/permission';
    fetchAll(): Observable<any> {
      return this._http.get<User>(`${this.baseUrl}/fetchAll`);
    }
}
