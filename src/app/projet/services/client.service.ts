import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Client } from '../models/client.model';
import { environment } from 'src/environments/environment';
import { ApiResponse, ApiSingleResponse } from 'src/app/shared/models/api-response';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/api/ordreConditionement/clients`;

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<Client[]> {
    return this.http.get<ApiResponse<Client>>(`${this.apiUrl}/fetchAll`).pipe(
      map((response) => response?.data ?? [])
    );
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<ApiSingleResponse<Client>>(`${this.apiUrl}/fetch/${id}`).pipe(
      map((response) => response.data)
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<ApiSingleResponse<Client>>(this.apiUrl, client).pipe(
      map((response) => response.data)
    );
  }

  updateClient(id: string, client: Client): Observable<Client> {
    const payload = { ...client, id };
    return this.http.put<ApiSingleResponse<Client>>(this.apiUrl, payload).pipe(
      map((response) => response.data)
    );
  }

  activerClient(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/activer`, {});
  }

  desactiverClient(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactiver`, {});
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
