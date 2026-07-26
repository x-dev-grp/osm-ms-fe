import { Component, effect, inject } from '@angular/core';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { COMPACT, HORIZONTAL, VERTICAL } from 'src/app/theme/const';
import { APP_LOGO_MARK } from 'src/app/shared/config/logo.config';

@Component({
  selector: 'app-nav-left',
  imports: [SharedModule],
  templateUrl: './toolbar-left.component.html',
  standalone: true,
  styleUrls: ['./toolbar-left.component.scss']
})
export class NavLeftComponent {
  private themeService = inject(ThemeLayoutService);

  readonly appLogoMark = APP_LOGO_MARK;
  showToggleMenu = true;
  readonly isMobileNav = this.themeService.isMobileNav;

  constructor() {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
  }

  private updateThemeLayout(layout: string) {
    if (layout === VERTICAL) {
      this.showToggleMenu = true;
    }
    if (layout === HORIZONTAL) {
      this.showToggleMenu = false;
    }
    if (layout === COMPACT) {
      this.showToggleMenu = true;
    }
  }

  toggleMenu() {
    this.themeService.toggleSideDrawer();
  }
}
