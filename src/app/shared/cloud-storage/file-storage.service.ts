// libs/osm-attachment/file-storage.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AttachmentMeta {
  hasAttachment: boolean;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class FileStorageService {
  private http = inject(HttpClient);
  private baseUrl = (window as any)?.env?.API_URL || '/api'; // or from environments

  uploadAttachment(tenantId: string, entity: string, objectId: string, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const req = new HttpRequest(
      'POST',
      `${this.baseUrl}/attachments/${tenantId}/${entity}/${objectId}`,
      formData,
      { reportProgress: true }
    );
    return this.http.request(req);
  }

  getAttachmentMeta(tenantId: string, entity: string, objectId: string) {
    return this.http.get<AttachmentMeta>(`${this.baseUrl}/attachments/${tenantId}/${entity}/${objectId}/meta`);
  }

  downloadAttachment(tenantId: string, entity: string, objectId: string) {
    return this.http.get(`${this.baseUrl}/attachments/${tenantId}/${entity}/${objectId}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
