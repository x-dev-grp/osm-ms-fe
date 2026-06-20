// libs/cloud-storage/file-storage.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';

export type BackendMeta = {
  id: string;
  fileId: string;
  name?: string;
  size?: number;
  mimeType?: string;
  webViewLink?: string;
};

@Injectable({ providedIn: 'root' })
export class FileStorageService {
  private base = '/api/unified-deliveries'; // backend routes

  constructor(private http: HttpClient) {}

  /** GET /{deliveryId}/file -> map to view Meta */
  async getMeta(deliveryId: string) {
    const res = await firstValueFrom(
      this.http.get<BackendMeta>(`${this.base}/${encodeURIComponent(deliveryId)}/file`, { observe: 'response' })
    );
    if (res.status === 200 && res.body) {
      return {
        hasAttachment: true,
        fileName: res.body.name,
        mimeType: res.body.mimeType,
        size: res.body.size,
        fileId: res.body.fileId ?? res.body['id'],
      };
    }
    return { hasAttachment: false };
  }

  /** POST multipart /{deliveryId}/file (progress callbacks supported) */
  async upload(
    deliveryId: string,
    file: File,
    onProgress?: (p: number) => void,
    onEvent?: (evt: HttpEvent<any>) => void
  ) {
    const fd = new FormData();
    fd.append('file', file);
    const req = new HttpRequest('POST', `${this.base}/${encodeURIComponent(deliveryId)}/file`, fd, {
      reportProgress: true,
    });
    const stream$ = this.http.request(req);
    return firstValueFrom(
      stream$.pipe(
        map((evt) => {
          onEvent?.(evt);
          // best-effort numeric progress callback
          return evt;
        })
      )
    ).catch((e) => {
      // rethrow to let component map status -> message
      throw e;
    });
  }

  /** GET blob /{deliveryId}/file/download */
  download(deliveryId: string): Observable<Blob> {
    return this.http.get(`${this.base}/${encodeURIComponent(deliveryId)}/file/download`, {
      responseType: 'blob',
    }) as Observable<Blob>;
  }
}
