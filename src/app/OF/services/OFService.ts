import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdreFabrication } from '../models/of.model';
import {environment} from "../../../environments/environment";
import {Bom} from "../../stock/models/Bom";

@Injectable({ providedIn: 'root' })
export class OFService {
  private apiUrl ='http://localhost:8084/api/ordreConditionement/of';

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdreFabrication[]> {
    return this.http.get<OrdreFabrication[]>(`${this.apiUrl}/all`);
  }
  getById(id: string): Observable<OrdreFabrication> {
    return this.http.get<OrdreFabrication>(`${this.apiUrl}/${id}`);
  }

  create(of: OrdreFabrication): Observable<OrdreFabrication> {
    return this.http.post<OrdreFabrication>(`${this.apiUrl}/create`, of);
  }

  demarrer(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.apiUrl}/${id}/demarrer`, {});
  }

  pause(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.apiUrl}/${id}/pause`, {});
  }

  reprendre(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.apiUrl}/${id}/reprise`, {});
  }

  cloturer(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.apiUrl}/${id}/cloturer`, {});
  }

  saisirProduction(id: string, quantiteBonne: number, quantiteNC: number): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.apiUrl}/${id}/production`, {
      quantiteBonne,
      quantiteNC
    });
  }

  ajusterConsommation(id: string, ajustements: any[]): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.apiUrl}/${id}/ajustements`, ajustements);
  }
}
