import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, Messaging } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../auth/services/tokenService.service';
import { UserNotification } from '../models/notification.model';

interface FirebaseWebConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  vapidKey?: string;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private permissionRequested = false;
  private lastShownTitle = '';
  private lastRegisteredToken: string | null = null;
  private messaging: Messaging | null = null;

  async initAfterLogin(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn('[PushNotification] FCM messaging is not supported in this browser');
        return;
      }

      const cfg = await this.loadFirebaseConfig();
      if (!this.isConfigReady(cfg)) {
        console.warn('[PushNotification] FCM web config is incomplete; skipping push registration');
        return;
      }

      if (!this.permissionRequested) {
        this.permissionRequested = true;
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') {
        return;
      }

      const app = this.ensureFirebaseApp(cfg);
      this.messaging = getMessaging(app);

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });

      const token = await getToken(this.messaging, {
        vapidKey: cfg.vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        this.registerDevice(token);
      }
    } catch (error) {
      console.warn('[PushNotification] FCM init failed', error);
      if (Notification.permission === 'default' && !this.permissionRequested) {
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

  registerDevice(token: string): void {
    const userId = this.currentUserId();
    if (!userId || !token) {
      return;
    }
    if (token === this.lastRegisteredToken) {
      return;
    }
    this.lastRegisteredToken = token;
    this.http
      .post(`${environment.apiUrl}/api/security/user/register-device`, {
        userId,
        token
      })
      .subscribe({
        next: () => undefined,
        error: () => {
          this.lastRegisteredToken = null;
        }
      });
  }

  private async loadFirebaseConfig(): Promise<FirebaseWebConfig> {
    const fromEnv = environment.firebase || {};
    try {
      const remote = await firstValueFrom(this.http.get<FirebaseWebConfig>('assets/firebase-config.json'));
      return { ...fromEnv, ...(remote || {}) };
    } catch {
      return fromEnv;
    }
  }

  private isConfigReady(cfg: FirebaseWebConfig): boolean {
    return !!(
      cfg.apiKey?.trim() &&
      cfg.projectId?.trim() &&
      cfg.messagingSenderId?.trim() &&
      cfg.appId?.trim() &&
      cfg.vapidKey?.trim()
    );
  }

  private ensureFirebaseApp(cfg: FirebaseWebConfig): FirebaseApp {
    const existing = getApps()[0];
    if (existing) {
      return existing;
    }
    return initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId
    });
  }

  private currentUserId(): string | null {
    const decoded = this.tokenService.decodeToken() as Record<string, unknown> | null;
    const nested = (decoded?.['oosmUser'] ?? decoded?.['osmUser']) as { id?: string } | undefined;
    return nested?.id ?? (typeof decoded?.['sub'] === 'string' ? decoded['sub'] : null);
  }
}
