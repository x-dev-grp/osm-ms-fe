import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../auth/services/tokenService.service';
import { UserNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private permissionRequested = false;
  private lastShownTitle = '';

  async initAfterLogin(): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission === 'default' && !this.permissionRequested) {
      this.permissionRequested = true;
      await Notification.requestPermission();
    }
  }

  notifyIfBackground(unreadCount: number, latest?: UserNotification): void {
    if (document.visibilityState !== 'hidden' || Notification.permission !== 'granted' || !latest) {
      return;
    }
    this.showNotification(latest.title, latest.recap, latest.webRoute || latest.payload?.['webRoute']);
  }

  showNotification(title: string, body: string, route?: string): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    const dedupeKey = `${title}:${body}`;
    if (dedupeKey === this.lastShownTitle) {
      return;
    }
    this.lastShownTitle = dedupeKey;

    const notification = new Notification(title, {
      body,
      icon: 'assets/pwa/manifest-icon-192.maskable.png',
      badge: 'assets/pwa/manifest-icon-192.maskable.png',
      tag: dedupeKey
    });

    notification.onclick = () => {
      window.focus();
      if (route) {
        window.location.href = route;
      }
      notification.close();
    };
  }

  registerDevice(playerId: string): void {
    const decoded = this.tokenService.decodeToken() as Record<string, unknown> | null;
    const userId = ((decoded?.['oosmUser'] ?? decoded?.['osmUser']) as { id?: string } | undefined)?.id;
    if (!userId || !playerId) {
      return;
    }
    this.http
      .post(`${environment.apiUrl}/api/security/user/register-device`, {
        userId,
        playerId
      })
      .subscribe({ error: () => undefined });
  }
}
