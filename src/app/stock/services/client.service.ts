import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { environment } from 'src/environments/environment';
import { ApiResponse } from 'src/app/shared/models/api-response';


@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/api/inventaire/clients`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<ApiResponse<Client>> {
    return this.http.get<ApiResponse<Client>>(this.apiUrl);
  }

  getClientById(id: string): Observable<ApiResponse<Client>> {
    return this.http.get<ApiResponse<Client>>(`${this.apiUrl}/${id}`);
  }

  createClient(client: Client): Observable<ApiResponse<Client>> {
    return this.http.post<ApiResponse<Client>>(`${this.apiUrl}/create`, client);
  }

  updateClient(id: string, client: Client): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.apiUrl}/${id}`, client);
  }

  activerClient(id: string): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.apiUrl}/${id}/activer`, {});
  }

  desactiverClient(id: string): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  deleteClient(id: string): Observable<ApiResponse<Client>> {
    return this.http.delete<ApiResponse<Client>>(`${this.apiUrl}/${id}`);
  }
}
