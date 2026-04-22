import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrdreFabrication } from '../models/of.model';
import {environment} from "../../../environments/environment";
import { QrCodeInfo } from "../../shared/models/qr-models";

@Injectable({ providedIn: 'root' })
export class OFService {
  private baseUrl = environment.apiUrl + '/api/ordreConditionement/of';

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrdreFabrication[]> {
    return this.http.get<OrdreFabrication[]>(`${this.baseUrl}/all`);
  }
  getById(id: string): Observable<OrdreFabrication> {
    return this.http.get<OrdreFabrication>(`${this.baseUrl}/${id}`);
  }

  getByCode(code: string): Observable<OrdreFabrication> {
    return this.http.get<OrdreFabrication>(`${this.baseUrl}/search/by-code`, {
      params: { code }
    });
  }

  create(of: OrdreFabrication): Observable<OrdreFabrication> {
    return this.http.post<OrdreFabrication>(`${this.baseUrl}/create`, of);
  }

  demarrer(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/demarrer`, {});
  }

  pause(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/pause`, {});
  }

  reprendre(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/reprise`, {});
  }

  cloturer(id: string): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/cloturer`, {});
  }

  saisirProduction(id: string, bons: number, nc: number): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/production`, { quantiteBonne: bons, quantiteNC: nc });
  }

  ajusterConsommation(id: string, ajustements: any[]): Observable<OrdreFabrication> {
    return this.http.put<OrdreFabrication>(`${this.baseUrl}/${id}/ajustements`, ajustements);
  }

  //-------QRCode-------//
  generateQr(entityId: string): Observable<QrCodeInfo> {
    return this.http.get<QrCodeInfo>(
      `${this.baseUrl}/qr/OF/${entityId}`
    );
  }
  //-------QRCode-------//

}
