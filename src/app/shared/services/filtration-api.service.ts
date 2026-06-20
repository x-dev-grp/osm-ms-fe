import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FiltrationOperation } from '../models/filtration-operation';
import { FiltrationRequest } from '../models/filtration-request';
import { FiltrationCompletion } from '../models/filtration-completion';
import { UpdateFiltrationStatus } from '../models/update-filtration-status';
import { FiltrationStatus } from '../models/filtration-status';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FiltrationApiService {
  // Base URL alignée sur le controller backend: /api/production/filtration
  private readonly baseUrl = environment.apiUrl + '/api/production/filtration';

  constructor(private http: HttpClient) {}

  // Création d’une nouvelle opération de filtration.
  create(req: FiltrationRequest): Observable<FiltrationOperation> {
    return this.http.post<FiltrationOperation>(this.baseUrl, req);
  }

  // Récupération de toutes les opérations (utilisé pour le tableau).
  getAll(): Observable<FiltrationOperation[]> {
    return this.http.get<FiltrationOperation[]>(`${this.baseUrl}/all`);
  }

  // Récupération d’une opération par son ID (utilisé pour l’écran Edit).
  getById(operationId: string): Observable<FiltrationOperation> {
    return this.http.get<FiltrationOperation>(`${this.baseUrl}/${operationId}`);
  }

  // Filtrer par statut (utilisé par le filtre en haut de la liste).
  getByStatus(status: FiltrationStatus): Observable<FiltrationOperation[]> {
    return this.http.get<FiltrationOperation[]>(`${this.baseUrl}/status/${status}`);
  }

  // Démarrer une opération (CREATED -> IN_PROGRESS).
  start(operationId: string): Observable<FiltrationOperation> {
    return this.http.put<FiltrationOperation>(`${this.baseUrl}/${operationId}/start`, {});
  }

  // Terminer une opération (nécessite volumeAfter).
  complete(operationId: string, body: FiltrationCompletion): Observable<FiltrationOperation> {
    return this.http.put<FiltrationOperation>(`${this.baseUrl}/${operationId}/complete`, body);
  }

  // Changer un statut + ajouter une note (le backend fait l’append sur l’historique de note).
  updateStatus(operationId: string, body: UpdateFiltrationStatus): Observable<FiltrationOperation> {
    return this.http.put<FiltrationOperation>(`${this.baseUrl}/${operationId}/status`, body);
  }

  update(operationId: string, payload: any) {
    return this.http.put<FiltrationOperation>(`${this.baseUrl}/${operationId}`, payload);
  }

  // Suppression (nécessite un endpoint DELETE côté backend).
  // L’UI affiche une confirmation avant d’appeler cette méthode.
  delete(operationId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${operationId}`);
  }
}
