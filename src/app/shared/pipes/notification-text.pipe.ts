import { inject, Pipe, PipeTransform } from '@angular/core';
import { UserNotification } from '../models/notification.model';
import { NotificationTextService } from '../services/notification-text.service';

@Pipe({ name: 'notificationText', standalone: true, pure: true })
export class NotificationTextPipe implements PipeTransform {
  private readonly textService = inject(NotificationTextService);

  transform(
    notification: UserNotification | null | undefined,
    part: 'title' | 'recap' = 'title',
    languageVersion?: number
  ): string {
    void languageVersion;
    if (!notification) {
      return '';
    }
    return part === 'title' ? this.textService.getTitle(notification) : this.textService.getRecap(notification);
  }
}
