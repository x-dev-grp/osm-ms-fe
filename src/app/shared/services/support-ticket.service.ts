import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateSupportTicketPayload,
  SupportTicket,
  SupportTicketPageResponse,
  SupportTicketScope,
  SupportTicketSingleResponse,
  UpdateSupportTicketPayload
} from '../models/support-ticket.model';
import { SupportTicketDialogComponent } from '../components/support-ticket-dialog/support-ticket-dialog.component';

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly baseUrl = `${environment.apiUrl}/api/security/support-tickets`;

  openCreateDialog(pageUrl?: string): void {
    this.dialog.open(SupportTicketDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { pageUrl: pageUrl ?? this.currentPageUrl() }
    });
  }

  create(payload: CreateSupportTicketPayload): Observable<SupportTicket | null> {
    return this.http.post<SupportTicketSingleResponse>(this.baseUrl, payload).pipe(
      map((response) => (response?.success ? response.data : null)),
      catchError(() => of(null))
    );
  }

  list(page = 0, size = 20, scope: SupportTicketScope = 'mine'): Observable<SupportTicketPageResponse> {
    return this.http
      .get<SupportTicketPageResponse>(`${this.baseUrl}?page=${page}&size=${size}&scope=${scope}`)
      .pipe(
        map((response) =>
          response?.success
            ? response
            : {
                success: false,
                message: response?.message ?? '',
                data: [],
                total: 0,
                page: page + 1,
                totalPages: 0
              }
        ),
        catchError(() =>
          of({
            success: false,
            message: '',
            data: [],
            total: 0,
            page: page + 1,
            totalPages: 0
          })
        )
      );
  }

  getById(id: string): Observable<SupportTicket | null> {
    return this.http.get<SupportTicketSingleResponse>(`${this.baseUrl}/${id}`).pipe(
      map((response) => (response?.success ? response.data : null)),
      catchError(() => of(null))
    );
  }

  update(id: string, payload: UpdateSupportTicketPayload): Observable<SupportTicket | null> {
    return this.http.patch<SupportTicketSingleResponse>(`${this.baseUrl}/${id}`, payload).pipe(
      map((response) => (response?.success ? response.data : null)),
      catchError(() => of(null))
    );
  }

  private currentPageUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }
}
