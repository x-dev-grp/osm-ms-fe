import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyUserDto } from '../models/company-user-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AddCompanyUserService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/api/security/company-profile';

  addCompanyWithUser(dto: CompanyUserDto): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save`, dto);
  }
}
