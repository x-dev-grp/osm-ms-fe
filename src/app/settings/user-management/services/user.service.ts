import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "src/app/@theme/types/user";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
    _http=inject(HttpClient);
    private baseUrl = environment.apiUrl + '/api/security/user';
    addUser(user: User): Observable<any> {
      return this._http.post<User>(`${this.baseUrl}/addUser`,user);
    }
    updateUser(user: User,id:string): Observable<any> {
      return this._http.post<User>(`${this.baseUrl}/updateUser/${id}`,user);
    }
    updatePassword(payload:{oldPassword:string,newPassword:string,newPasswordConfirmation:string},userId:string):Observable<any>{
      return this._http.post(`${this.baseUrl}/auth/updatePassword/${userId}`,payload);
    }

    fetchById(id:string):Observable<any>{
      return this._http.get(`${this.baseUrl}/fetch/${id}`);
    }
}
