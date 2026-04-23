import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Client } from "../models/Client";
import { environment } from "../../../environments/environment";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private baseUrl = environment.apiUrl + '/api/ordreConditionement/projet_client';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Client[]> {
    return this.http
      .get<ApiResponse<Client[]>>(`${this.baseUrl}/fetchAll`)
      .pipe(map(response => response.data ?? []));
  }

  getById(id: string): Observable<Client> {
    return this.http
      .get<ApiResponse<Client>>(`${this.baseUrl}/fetch/${id}`)
      .pipe(map(response => response.data));
  }

  create(client: Client): Observable<Client> {
    return this.http
      .post<ApiResponse<Client>>(this.baseUrl, client)
      .pipe(map(response => response.data));
  }

  update(id: string, client: Client): Observable<Client> {
    const payload = {
      ...client,
      id
    };

    return this.http
      .put<ApiResponse<Client>>(this.baseUrl, payload)
      .pipe(map(response => response.data));
  }

  delete(id: string): Observable<Client> {
    return this.http
      .delete<ApiResponse<Client>>(`${this.baseUrl}/delete/${id}`)
      .pipe(map(response => response.data));
  }
}
