// Angular import
import { Component, effect, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// project import
import { NavigationItem } from 'src/app/theme/types/navigation';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { HORIZONTAL, VERTICAL, COMPACT } from 'src/app/theme/const';
import { SharedModule } from 'src/app/shared/shared.module';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { MenuItemVerticalComponent } from './menu-item/menu-item.component';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { environment } from '../../../../../environments/environment';
import { CompanyProfile } from '../../../../shared/models/CompanyProfile';
import { Role } from '../../../../theme/types/role';
import { CompanyProfileService } from '../../../../shared/services/company-profile.service';
import { NavigationActiveService } from '../../../services/navigation-active.service';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-vertical-menu',
  imports: [
    SharedModule,
    TranslateModule,
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
export class VerticalMenuComponent implements OnInit {
  private themeService = inject(ThemeLayoutService);
  authenticationService = inject(AuthenticationService);
  private companyProfileService = inject(CompanyProfileService);
  private navigationActiveService = inject(NavigationActiveService);
  currentApplicationVersion = environment.appVersion;

  // public props
  readonly menus = input<NavigationItem[]>();
  showUser: false;
  showContent = true;
  direction: string = 'ltr';
  logoPreview: any;

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

  // Constructor
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

  ngOnInit(): void {
    this.loadCompanyProfileAndLogo();
  }

  /**
   * Loads company profile and logo from API or cache
   */
  private loadCompanyProfileAndLogo(): void {
    const currentUser = this.authenticationService.currentUserValue;

    // Only fetch company profile for non-OsmAdmin users who have a tenantId
    if (currentUser && currentUser.role !== Role.OsmAdmin && currentUser.tenantId) {
      console.log('[VerticalMenu] Fetching company profile for tenantId:', currentUser.tenantId);
      this.companyProfileService.getProfile().subscribe({
        next:  p => { this.logoPreview =  p.logoData;   },
        error: () => { console.log ('Unable to load profile');   }
      });
    } else {
      }
  }

  /**
   * Loads company logo from localStorage cache (fallback method)
   */
  private loadCompanyLogoFromCache(): void {
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
      this.companyProfileService.getProfile();
    }
    // Fallback: use default asset if not found
    if (!foundLogo) {
      this.logoPreview = 'assets/logo.jpg';
      console.log('[VerticalMenu] Falling back to default logo asset');
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  private loadCompanyLogo(): void {
    this.loadCompanyLogoFromCache();
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
