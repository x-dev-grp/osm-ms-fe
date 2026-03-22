import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "src/app/theme/types/user";
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
    _http=inject(HttpClient);
    private baseUrl = environment.apiUrl + '/api/security/user';
    addUser(user: User): Observable<any> {
      return this._http.post<User>(`${this.baseUrl}/addUser`,user);
    }
  // NOUVELLE méthode - inscription avec OTP
  registerWithOtp(user: { firstName: any; lastName: any; username: any; email: any; confirmationMethod: string; role: any; locked: boolean }): Observable<any> {
    return this._http.post(`${this.baseUrl}/auth/register-by-email-otp`, user, {
      responseType: 'text' // Car le backend retourne un message texte
    });
  }

  // Méthode pour vérifier l'OTP et définir le mot de passe
  verifyOtpAndSetPassword(email: string, code: string, newPassword: string, confirmPassword: string): Observable<any> {
    const payload = {email, code, newPassword, confirmPassword};
    return this._http.post(`${this.baseUrl}/auth/verify-otp-and-set-password`, payload);
  }

  // Renvoyer un nouveau code OTP
  resendActivationOtp(email: string): Observable<any> {
    return this._http.post(`${this.baseUrl}/auth/resend-activation-otp?email=${email}`, null, {
      responseType: 'text'
    });
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
    //identifier = email ou username
  resetPassword(identifier: string): Observable<any> {
    return this._http.post(
      `${this.baseUrl}/auth/resetPassword?identifier=${identifier}`,
      null
    );
  }

}
