import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';
import { UnreadCountResponse, UserNotification } from '../models/notification.model';
import { PushNotificationService } from './push-notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly pushNotificationService = inject(PushNotificationService);
  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  readonly unreadCount = signal(0);
  readonly notifications = signal<UserNotification[]>([]);
  readonly loading = signal(false);

  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private lastUnreadCount = 0;

  startPolling(): void {
    if (this.pollHandle) {
      return;
    }
    this.refresh();
    this.pollHandle = setInterval(() => this.refresh(), 30000);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stopPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  refresh(): void {
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
                latest.title,
                latest.recap,
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
    return this.http
      .get<ApiResponse<UserNotification>>(`${this.baseUrl}?page=0&size=20&unreadOnly=${unreadOnly}`)
      .pipe(
        map((response) => (response?.success ? response.data ?? [] : [])),
        tap((items) => this.notifications.set(items)),
        catchError(() => {
          this.notifications.set([]);
          return of([]);
        })
      );
  }

  markRead(notification: UserNotification): void {
    if (!notification?.id || notification.read) {
      return;
    }
    this.http.patch<{ success: boolean; data: UserNotification }>(`${this.baseUrl}/${notification.id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
        );
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
    if (document.visibilityState === 'visible') {
      this.refresh();
    }
  };
}
