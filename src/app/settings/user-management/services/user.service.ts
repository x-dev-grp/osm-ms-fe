import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from 'src/app/theme/types/user';
import { environment } from '../../../../environments/environment';

export interface AssignableUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roleName?: string;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  confirmationMethod: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface UserPhoto {
  photoData?: string | null;
  photoContentType?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  _http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/api/security/user';
  addUser(user: User): Observable<any> {
    return this._http.post<User>(`${this.baseUrl}/addUser`, user);
  }
  updateUser(user: User, id: string): Observable<any> {
    return this._http.post<User>(`${this.baseUrl}/updateUser/${id}`, user);
  }
  updateInitialPassword(
    payload: { oldPassword: string; newPassword: string; newPasswordConfirmation: string },
    userId: string
  ): Observable<any> {
    return this._http.post(`${this.baseUrl}/auth/initial-password/${userId}`, payload);
  }

  fetchById(id: string): Observable<any> {
    return this._http.get(`${this.baseUrl}/fetch/${id}`);
  }

  getMyProfile(): Observable<User> {
    return this._http.get<User>(`${this.baseUrl}/me`);
  }

  updateMyProfile(payload: UserProfileUpdate): Observable<User> {
    return this._http.put<User>(`${this.baseUrl}/me`, payload);
  }

  changeMyPassword(payload: ChangePasswordPayload): Observable<void> {
    return this._http.post<void>(`${this.baseUrl}/me/change-password`, payload);
  }

  getMyPhoto(): Observable<UserPhoto> {
    return this._http.get<UserPhoto>(`${this.baseUrl}/me/photo`);
  }

  uploadMyPhoto(payload: UserPhoto): Observable<UserPhoto> {
    return this._http.post<UserPhoto>(`${this.baseUrl}/me/photo`, payload);
  }

  removeMyPhoto(): Observable<void> {
    return this._http.delete<void>(`${this.baseUrl}/me/photo`);
  }

  getUsersByPermission(moduleName: string, entity: string, permission: string): Observable<AssignableUser[]> {
    const params = new HttpParams().set('module', moduleName).set('entity', entity).set('permission', permission);

    return this._http.get<AssignableUser[]>(`${this.baseUrl}/assignable`, { params });
  }
}
