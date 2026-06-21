import { Component, effect, inject, input } from '@angular/core';
import { NavigationItem } from 'src/app/theme/types/navigation';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { MenuItemVerticalComponent } from './menu-item/menu-item.component';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { NavigationActiveService } from '../../../services/navigation-active.service';

@Component({
  selector: 'app-vertical-menu',
  imports: [SharedModule, MenuGroupVerticalComponent, MenuItemVerticalComponent, MenuCollapseComponent],
  templateUrl: './vertical-menu.component.html',
  standalone: true,
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent {
  private themeService = inject(ThemeLayoutService);
  private navigationActiveService = inject(NavigationActiveService);

  readonly menus = input<NavigationItem[]>();
  direction: string = 'ltr';

  constructor() {
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

  private isRtlTheme(direction: string) {
    this.direction = direction;
  }
}
