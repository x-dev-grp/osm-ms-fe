// services/bom.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Bom} from "../models/Bom";
import {create} from "lodash";


@Injectable({ providedIn: 'root' })
export class BomService {
  private apiUrl = 'http://localhost:8084/api/inventaire/boms';

  constructor(private http: HttpClient) {}



  getById(id: string): Observable<Bom> {
    return this.http.get<Bom>(`${this.apiUrl}/${id}`);
  }

  getBomsBySku(skuId: string): Observable<Bom[]> {
    return this.http.get<Bom[]>(`${this.apiUrl}/sku/${skuId}`);
  }

  create(bom: Bom): Observable<Bom> {
    return this.http.post<Bom>(`${this.apiUrl}/create`, bom);
  }
  update(id: string, bom: Bom): Observable<Bom> {
    return this.http.put<Bom>(`${this.apiUrl}/${id}`, bom);
  }
  getAll(): Observable<Bom[]> {
    return this.http.get<Bom[]>(`${this.apiUrl}/all`);
  }
}
