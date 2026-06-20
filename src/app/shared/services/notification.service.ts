import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationPageResponse, UnreadCountResponse, UserNotification } from '../models/notification.model';
import { PushNotificationService } from './push-notification.service';
import { NotificationTextService } from './notification-text.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly pushNotificationService = inject(PushNotificationService);
  private readonly notificationTextService = inject(NotificationTextService);
  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  readonly unreadCount = signal(0);
  readonly notifications = signal<UserNotification[]>([]);
  readonly loading = signal(false);

  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private lastUnreadCount = 0;
  private pollingActive = false;

  startPolling(): void {
    if (this.pollingActive) {
      return;
    }
    this.pollingActive = true;
    this.refresh();
    this.resumePolling();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stopPolling(): void {
    this.pollingActive = false;
    this.pausePolling();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  refresh(): void {
    if (!this.pollingActive && document.visibilityState === 'hidden') {
      return;
    }

    this.loading.set(true);
    this.http
      .get<UnreadCountResponse>(`${this.baseUrl}/unread-count`)
      .pipe(catchError(() => of({ success: false, count: 0 })))
      .subscribe((response) => {
        const count = response?.count ?? 0;
        if (count > this.lastUnreadCount) {
          this.loadNotifications(true).subscribe((items) => {
            const latest = items[0];
            if (latest) {
              this.pushNotificationService.showNotification(
                this.notificationTextService.getTitle(latest),
                this.notificationTextService.getRecap(latest),
                latest.webRoute || latest.payload?.['webRoute']
              );
            }
          });
        }
        this.lastUnreadCount = count;
        this.unreadCount.set(count);
        this.loading.set(false);
      });
  }

  loadNotifications(unreadOnly = false): Observable<UserNotification[]> {
    return this.loadPage(0, 20, unreadOnly).pipe(
      tap((page) => this.notifications.set(page.data ?? [])),
      map((page) => page.data ?? []),
      catchError(() => {
        this.notifications.set([]);
        return of([]);
      })
    );
  }

  loadPage(page: number, size: number, unreadOnly = false): Observable<NotificationPageResponse> {
    return this.http
      .get<NotificationPageResponse>(`${this.baseUrl}?page=${page}&size=${size}&unreadOnly=${unreadOnly}`)
      .pipe(
        tap((response) => {
          if (response?.success) {
            this.unreadCount.set(response.unreadCount ?? this.unreadCount());
            this.lastUnreadCount = response.unreadCount ?? this.lastUnreadCount;
          }
        }),
        map((response) =>
          response?.success
            ? response
            : {
                success: false,
                message: response?.message ?? '',
                data: [],
                total: 0,
                page: page + 1,
                totalPages: 0,
                unreadCount: 0
              }
        ),
        catchError(() =>
          of({
            success: false,
            message: '',
            data: [],
            total: 0,
            page: page + 1,
            totalPages: 0,
            unreadCount: 0
          })
        )
      );
  }

  markRead(notification: UserNotification): void {
    if (!notification?.id || notification.read) {
      return;
    }
    this.http.patch<{ success: boolean; data: UserNotification }>(`${this.baseUrl}/${notification.id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update((items) => items.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
        this.unreadCount.update((count) => Math.max(0, count - 1));
        this.lastUnreadCount = this.unreadCount();
      }
    });
  }

  markAllRead(): void {
    this.http.patch<{ success: boolean }>(`${this.baseUrl}/read-all`, {}).subscribe({
      next: () => {
        this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
        this.unreadCount.set(0);
        this.lastUnreadCount = 0;
      }
    });
  }

  openNotification(notification: UserNotification): void {
    this.markRead(notification);
    const route = notification.webRoute || notification.payload?.['webRoute'];
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.pausePolling();
      return;
    }
    this.refresh();
    this.resumePolling();
  };

  private resumePolling(): void {
    if (!this.pollingActive || this.pollHandle || document.visibilityState === 'hidden') {
      return;
    }
    this.pollHandle = setInterval(() => this.refresh(), POLL_INTERVAL_MS);
  }

  private pausePolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
