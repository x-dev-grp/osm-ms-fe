// Angular import
import { Component, effect, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// project import
import { NavigationItem } from 'src/app/theme/types/navigation';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { COMPACT, HORIZONTAL, VERTICAL } from 'src/app/theme/const';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { MenuItemVerticalComponent } from './menu-item/menu-item.component';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { NavigationActiveService } from '../../../services/navigation-active.service';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { NotificationTextService } from '../../../../shared/services/notification-text.service';
import { ChatService } from '../../../../shared/services/chat.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vertical-menu',
  imports: [
    SharedModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MenuGroupVerticalComponent,
    MenuItemVerticalComponent,
    MenuCollapseComponent,
    RouterModule,
    UserAvatarComponent
  ],
  templateUrl: './vertical-menu.component.html',
  standalone: true,
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent {
  private themeService = inject(ThemeLayoutService);
  authenticationService = inject(AuthenticationService);
  private navigationActiveService = inject(NavigationActiveService);
  private readonly notificationService = inject(NotificationService);
  readonly notificationTextService = inject(NotificationTextService);
  private readonly chatService = inject(ChatService);

  readonly menus = input<NavigationItem[]>();
  readonly companyName = input('');
  readonly unreadCount = this.notificationService.unreadCount;
  readonly messageUnreadCount = this.chatService.unreadCount;

  showContent = true;
  direction: string = 'ltr';

  get displayName(): string {
    const user = this.authenticationService.currentUserValue;
    if (!user) {
      return '';
    }
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.username || '';
  }

  get roleLabel(): string {
    const role = this.authenticationService.currentUserValue?.role;
    if (!role) {
      return '';
    }
    return typeof role === 'string' ? role : role.roleName || '';
  }

  constructor() {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
    effect(() => {
      const menuItems = this.menus();
      if (menuItems?.length) {
        this.navigationActiveService.setMenuItems(menuItems);
      }
    });
  }

  private updateThemeLayout(layout: string) {
    if (layout == VERTICAL) {
      this.showContent = true;
    }
    if (layout == HORIZONTAL) {
      this.showContent = false;
    }
    if (layout == COMPACT) {
      this.showContent = false;
    }
  }

  private isRtlTheme(direction: string) {
    this.direction = direction;
  }

  logout() {
    this.authenticationService.logout();
  }
}
