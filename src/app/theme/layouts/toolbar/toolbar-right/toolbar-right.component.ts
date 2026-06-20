import { Component, DestroyRef, effect, inject, OnInit, output } from '@angular/core';
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
import { AbleProConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/shared/shared.module';
import { RTL } from '../../../const';
import { ThemeConfigService } from '../../../../shared/services/theme-config.service';
import { GlobalSearchService } from '../../../../shared/services/global-search.service';
import { QrResolveResponse } from '../../../../shared/models/qr-models';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { PushNotificationService } from '../../../../shared/services/push-notification.service';
import { UserNotification } from '../../../../shared/models/notification.model';

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
    UserAvatarComponent
  ],
  templateUrl: './toolbar-right.component.html',
  standalone: true,
  styleUrls: ['./toolbar-right.component.scss']
})
export class NavRightComponent implements OnInit {
  authenticationService = inject(AuthenticationService);
  private readonly notificationService = inject(NotificationService);
  private readonly pushNotificationService = inject(PushNotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly unreadCount = this.notificationService.unreadCount;
  readonly notifications = this.notificationService.notifications;

  readonly HeaderBlur = output();
  direction: string = 'ltr';
  searchCode = '';
  searching = false;

  private translate = inject(TranslateService);
  private themeService = inject(ThemeLayoutService);
  private router = inject(Router);
  private globalSearchService = inject(GlobalSearchService);
  private themeDirection = inject(ThemeConfigService);

  constructor() {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      this.translate.use(savedLang);
      if (savedLang === 'ar') {
        this.themeService.directionChange.set(RTL);
        this.themeDirection.applyrtl(true);
      } else {
        this.themeDirection.applyrtl(false);
      }
    } else {
      this.translate.setDefaultLang(AbleProConfig.i18n);
    }

    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
  }

  ngOnInit(): void {
    if (this.authenticationService.currentUserValue) {
      this.notificationService.startPolling();
      void this.pushNotificationService.initAfterLogin();
    }
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
    this.translate.use(language);
    localStorage.setItem('app_language', language);
    window.location.reload();
  }

  headerBlur() {
    this.HeaderBlur.emit();
  }

  logout() {
    this.notificationService.stopPolling();
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
