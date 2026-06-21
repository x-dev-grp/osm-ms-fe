import { Component, DestroyRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { GlobalSearchService } from '../../../../shared/services/global-search.service';
import { QrResolveResponse } from '../../../../shared/models/qr-models';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { NotificationTextService } from '../../../../shared/services/notification-text.service';
import { LanguageService } from '../../../../shared/services/language.service';
import { UserNotification } from '../../../../shared/models/notification.model';
import { NotificationTextPipe } from '../../../../shared/pipes/notification-text.pipe';

@Component({
  selector: 'app-nav-right',
  imports: [
    TranslateModule,
    SharedModule,
    CommonModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    UserAvatarComponent,
    NotificationTextPipe
  ],
  templateUrl: './toolbar-right.component.html',
  standalone: true,
  styleUrls: ['./toolbar-right.component.scss']
})
export class NavRightComponent {
  authenticationService = inject(AuthenticationService);
  private readonly notificationService = inject(NotificationService);
  readonly notificationTextService = inject(NotificationTextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly unreadCount = this.notificationService.unreadCount;
  readonly notifications = this.notificationService.notifications;

  get currentLang(): string {
    return this.translate.currentLang || localStorage.getItem('app_language') || 'en';
  }

  direction: string = 'ltr';
  searchCode = '';
  searching = false;

  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeLayoutService);
  private router = inject(Router);
  private globalSearchService = inject(GlobalSearchService);

  constructor() {
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
  }

  openNotificationsMenu(): void {
    this.notificationService.loadNotifications(false).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  openNotification(notification: UserNotification): void {
    this.notificationService.openNotification(notification);
  }

  markAllNotificationsRead(): void {
    this.notificationService.markAllRead();
  }

  useLanguage(language: string) {
    this.languageService.applyLanguage(language);
  }

  logout() {
    this.authenticationService.logout();
  }

  private isRtlTheme(direction: string) {
    this.direction = direction;
  }

  Search() {
    const code = this.searchCode.trim();
    if (!code || this.searching) {
      return;
    }

    this.searching = true;
    this.globalSearchService.searchByCode(code).subscribe({
      next: (response) => {
        this.searching = false;
        const hit = response.result || response.results?.[0];
        if (!hit) {
          alert(this.translate.instant('AUTO.CODE_INTROUVABLE'));
          return;
        }
        this.navigateToFoundEntity(hit);
      },
      error: () => {
        this.searching = false;
        alert(this.translate.instant('AUTO.CODE_INTROUVABLE'));
      }
    });
  }

  private navigateToFoundEntity(entity: QrResolveResponse): void {
    if (entity.webRoute) {
      this.router.navigateByUrl(entity.webRoute);
      return;
    }

    if (entity.entityType === 'OF' && entity.entityId) {
      this.router.navigate(['/of', entity.entityId]);
      return;
    }

    if (entity.entityType === 'PROJET' && entity.entityId) {
      this.router.navigate(['/projets/detail', entity.entityId]);
      return;
    }

    if (entity.entityType === 'UNIFIEDDELIVERY' && entity.entityId) {
      this.router.navigate(['/reception/reception-details', entity.entityId]);
      return;
    }

    alert(`Entite trouvee (${entity.entityType}) mais route indisponible`);
  }
}
