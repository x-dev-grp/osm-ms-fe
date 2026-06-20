import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserNotification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationTextService {
  private readonly translate = inject(TranslateService);
  readonly languageVersion = signal(0);

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.languageVersion.update((value) => value + 1);
    });
  }

  getTitle(notification: UserNotification): string {
    const key = this.ruleKey(notification, 'TITLE');
    if (key) {
      const translated = this.translate.instant(key);
      if (translated !== key) {
        return translated;
      }
    }
    return notification.title ?? '';
  }

  getRecap(notification: UserNotification): string {
    const key = this.ruleKey(notification, 'RECAP');
    if (key) {
      const translated = this.translate.instant(key, this.buildParams(notification));
      if (translated !== key) {
        return translated;
      }
    }
    return notification.recap ?? '';
  }

  private ruleKey(notification: UserNotification, suffix: 'TITLE' | 'RECAP'): string | null {
    if (!notification.ruleCode) {
      return null;
    }
    return `NOTIFICATIONS.RULES.${notification.ruleCode}.${suffix}`;
  }

  private buildParams(notification: UserNotification): Record<string, string> {
    const params: Record<string, string> = { ...(notification.payload ?? {}) };
    if (notification.actorDisplayName) {
      params['actor'] = notification.actorDisplayName;
    }
    if (notification.entityId) {
      params['entityId'] = notification.entityId;
    }
    return params;
  }
}
