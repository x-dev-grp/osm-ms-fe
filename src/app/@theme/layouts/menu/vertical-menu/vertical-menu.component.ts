// Angular import
import { Component, effect, inject, input, OnInit } from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { NavigationItem } from 'src/app/@theme/types/navigation';
import { ThemeLayoutService } from 'src/app/@theme/services/theme-layout.service';
import { HORIZONTAL, VERTICAL, COMPACT } from 'src/app/@theme/const';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { MenuItemVerticalComponent } from './menu-item/menu-item.component';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { environment } from '../../../../../environments/environment';
import { CompanyProfile } from '../../../../shared/models/CompanyProfile';

@Component({
  selector: 'app-vertical-menu',
  imports: [SharedModule, MenuGroupVerticalComponent, MenuItemVerticalComponent, MenuCollapseComponent, RouterModule],
  templateUrl: './vertical-menu.component.html',
  standalone: true,
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private themeService = inject(ThemeLayoutService);
  authenticationService = inject(AuthenticationService);
  currentApplicationVersion = environment.appVersion;

  // public props
  readonly menus = input<NavigationItem[]>();
  showUser: false;
  showContent = true;
  direction: string = 'ltr';
  logoPreview: string | null = null;

  // Constructor
  constructor() {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
    effect(() => {
      this.isRtlTheme(this.themeService.directionChange());
    });
  }

  ngOnInit(): void {
    this.loadCompanyLogo();
  }

  private loadCompanyLogo(): void {
    console.log('[VerticalMenu] Attempting to load company logo from localStorage');
    const cachedProfile = localStorage.getItem('company_profile');
    let foundLogo = false;
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        let profile: CompanyProfile | null = null;
        // Support both API response and direct object
        if (parsed) {
          profile = parsed ;
          console.log('[VerticalMenu] Parsed company profile from API response format', profile);
        }
        if (profile && profile.logoData && profile.logoContentType) {
          this.logoPreview = `data:${profile.logoContentType};base64,${profile.logoData}`;
          foundLogo = true;
          console.log('[VerticalMenu] Loaded logo from localStorage');
        } else {
          console.log('[VerticalMenu] No logo found in profile');
        }
      } catch (e) {
        // Ignore malformed cache
        console.warn('[VerticalMenu] Failed to parse cached company profile', e);
      }
    } else {
      console.log('[VerticalMenu] No company_profile found in localStorage');
    }
    // Fallback: use default asset if not found
    if (!foundLogo) {
      this.logoPreview = 'assets/logo.jpg';
      console.log('[VerticalMenu] Falling back to default logo asset');
    }
  }

  // public method
  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
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

  // user Logout
  logout() {
    this.authenticationService.logout();
  }
}
