import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../auth/services/tokenService.service';
import { UserNotification } from '../models/notification.model';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalSdk) => void | Promise<void>>;
    OneSignal?: OneSignalSdk;
  }
}

interface OneSignalPushSubscription {
  id?: string | null;
  optedIn?: boolean;
  addEventListener: (event: 'change', listener: (event: { current: OneSignalPushSubscription }) => void) => void;
}

interface OneSignalSdk {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<boolean>;
    permissionNative?: NotificationPermission;
  };
  User: {
    PushSubscription: OneSignalPushSubscription;
  };
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private permissionRequested = false;
  private lastShownTitle = '';
  private initialized = false;
  private lastRegisteredSubscriptionId: string | null = null;

  async initAfterLogin(): Promise<void> {
    const appId = environment.oneSignalAppId?.trim();
    if (!appId || typeof window === 'undefined') {
      return;
    }

    try {
      const oneSignal = await this.ensureOneSignalReady(appId);
      const userId = this.currentUserId();
      if (userId) {
        try {
          await oneSignal.login(userId);
        } catch {
          // login is best-effort; subscription registration still proceeds
        }
      }

      if (!this.permissionRequested) {
        this.permissionRequested = true;
        await oneSignal.Notifications.requestPermission();
      }

      const registerCurrent = (): void => {
        const subscriptionId = oneSignal.User.PushSubscription.id;
        if (subscriptionId) {
          this.registerDevice(subscriptionId);
        }
      };

      registerCurrent();
      oneSignal.User.PushSubscription.addEventListener('change', (event) => {
        const subscriptionId = event?.current?.id;
        if (subscriptionId) {
          this.registerDevice(subscriptionId);
        }
      });
    } catch (error) {
      console.warn('[PushNotification] OneSignal init failed', error);
      // Fallback: browser Notification permission only
      if ('Notification' in window && Notification.permission === 'default' && !this.permissionRequested) {
        this.permissionRequested = true;
        await Notification.requestPermission();
      }
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
    const userId = this.currentUserId();
    if (!userId || !playerId) {
      return;
    }
    if (playerId === this.lastRegisteredSubscriptionId) {
      return;
    }
    this.lastRegisteredSubscriptionId = playerId;
    this.http
      .post(`${environment.apiUrl}/api/security/user/register-device`, {
        userId,
        playerId
      })
      .subscribe({
        next: () => undefined,
        error: () => {
          this.lastRegisteredSubscriptionId = null;
        }
      });
  }

  private currentUserId(): string | null {
    const decoded = this.tokenService.decodeToken() as Record<string, unknown> | null;
    const nested = (decoded?.['oosmUser'] ?? decoded?.['osmUser']) as { id?: string } | undefined;
    return nested?.id ?? (typeof decoded?.['sub'] === 'string' ? decoded['sub'] : null);
  }

  private ensureOneSignalReady(appId: string): Promise<OneSignalSdk> {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('OneSignal SDK load timeout')), 15000);

      const boot = async (OneSignal: OneSignalSdk): Promise<void> => {
        try {
          if (!this.initialized) {
            await OneSignal.init({
              appId,
              allowLocalhostAsSecureOrigin: !environment.production,
              serviceWorkerPath: 'OneSignalSDKWorker.js',
              serviceWorkerParam: { scope: '/' }
            });
            this.initialized = true;
          }
          window.clearTimeout(timeout);
          resolve(OneSignal);
        } catch (error) {
          window.clearTimeout(timeout);
          reject(error);
        }
      };

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(boot);
    });
  }
}
