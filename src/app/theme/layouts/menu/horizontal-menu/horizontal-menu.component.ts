import { Component, effect, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationItem } from '../../../types/navigation';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuGroupHorizontalComponent } from './menu-group-horizontal/menu-group-horizontal.component';
import { MenuCollapseComponent } from '../vertical-menu/menu-collapse/menu-collapse.component';
import { MenuItemVerticalComponent } from '../vertical-menu/menu-item/menu-item.component';
import { NavigationActiveService } from '../../../services/navigation-active.service';
import { ThemeLayoutService } from '../../../services/theme-layout.service';
import { LTR, RTL } from '../../../const';

@Component({
  selector: 'app-horizontal-menu',
  imports: [SharedModule, RouterModule, MenuGroupHorizontalComponent, MenuCollapseComponent, MenuItemVerticalComponent],
  templateUrl: './horizontal-menu.component.html',
  standalone: true,
  styleUrls: ['./horizontal-menu.component.scss']
})
export class HorizontalMenuComponent {
  private readonly navigationActiveService = inject(NavigationActiveService);
  private readonly themeService = inject(ThemeLayoutService);

  readonly menus = input<NavigationItem[]>();
  direction: string = LTR;

  constructor() {
    effect(() => {
      const menuItems = this.menus();
      if (menuItems?.length) {
        this.navigationActiveService.setMenuItems(menuItems);
      }
    });

    effect(() => {
      this.direction = this.themeService.directionChange() === RTL ? RTL : LTR;
    });
  }
}
