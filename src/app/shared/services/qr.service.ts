// qr.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { QrCodeInfo, QrResolveResponse } from '../models/qr-models';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generate a QR code for a given entity type and ID.
   * @param entityType - e.g., 'OF', 'LOT', 'PALETTE'
   * @param entityId - UUID of the entity
   * @returns Observable<QrCodeInfo>
   */
  generateQr(entityType: string, entityId: string): Observable<QrCodeInfo> {
    const url = `${this.baseUrl}/api/${entityType.toLowerCase()}/qr/${entityType}/${entityId}`;
    console.log(`[QR] Generating QR for ${entityType} with ID ${entityId}`);
    return this.http.get<QrCodeInfo>(url).pipe(
      tap(info => console.log(`[QR] Generated: publicCode=${info.publicCode}, qrUrl=${info.qrUrl}, hasImage=${!!info.qrImageBase64}`))
    );
  }

  /**
   * Resolve a QR code using entity type and public code.
   * @param entityType - e.g., 'OF', 'LOT'
   * @param publicCode - 6-character hex code
   * @returns Observable<QrResolveResponse>
   */
  resolveQr(entityType: string, publicCode: string): Observable<QrResolveResponse> {
    const url = `${this.baseUrl}/api/qr/resolve/${entityType}/${publicCode}`;
    console.log(`[QR] Resolving ${entityType} with code ${publicCode}`);
    return this.http.get<QrResolveResponse>(url).pipe(
      tap(response => console.log(`[QR] Resolved: label=${response.label}, status=${response.status}`))
    );
  }
}
