// Angular import
import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, effect, inject, OnInit, viewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawer, MatDrawerMode } from '@angular/material/sidenav';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layouts/toolbar/toolbar.component';
import { VerticalMenuComponent } from 'src/app/theme/layouts/menu/vertical-menu';
import { HorizontalMenuComponent } from 'src/app/theme/layouts/menu/horizontal-menu/horizontal-menu.component';

import { BreadcrumbComponent } from 'src/app/theme/components/breadcrumb/breadcrumb.component';
import { FooterComponent } from 'src/app/theme/layouts/footer/footer.component';
import { MobileBottomNavComponent } from 'src/app/theme/layouts/mobile-bottom-nav/mobile-bottom-nav.component';

// service
import { AuthenticationService } from 'src/app/auth/services/authentication.service';

// const import
import { COMPACT, HORIZONTAL, LTR, MAX_WIDTH_1024PX, MIN_WIDTH_1025PX, RTL, VERTICAL } from 'src/app/theme/const';

// theme version
import { environment } from 'src/environments/environment';

//type
import { Navigation } from 'src/app/theme/types/navigation';
import { Role } from 'src/app/theme/types/role';
import { APP_LOGO_MARK } from '../../../shared/config/logo.config';
import { oosm_menus } from '../../../shared/oosm_menu';
import { admin_menus } from '../../../shared/admin_menu';
import { filterMenuByPermissions } from '../../../shared/utils/menu-permission.filter';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { ThemeConfig, ThemeConfigService } from '../../../shared/services/theme-config.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { PushNotificationService } from '../../../shared/services/push-notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { FlowingBackgroundMediaComponent } from '../shared/flowing-background-media/flowing-background-media.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    SharedModule,
    RouterModule,
    CommonModule,
    NavBarComponent,
    VerticalMenuComponent,
    HorizontalMenuComponent,

    BreadcrumbComponent,
    FooterComponent,
    MobileBottomNavComponent,
    TranslateModule,
    FlowingBackgroundMediaComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
   authenticationService = inject(AuthenticationService);
  companyProfileService = inject(CompanyProfileService);
  private themeConfig = inject(ThemeConfigService);
  private notificationService = inject(NotificationService);
  private pushNotificationService = inject(PushNotificationService);
  private router = inject(Router);
// public props
  readonly sidebar = viewChild<MatDrawer>('sidebar');
  menus: Navigation[] = [];
  modeValue: MatDrawerMode = 'side';
  direction: string = typeof localStorage !== 'undefined' && localStorage.getItem('app_language') === 'ar' ? RTL : LTR;
  currentApplicationVersion = environment.appVersion;
  currentLayout: string = 'vertical';
  rtlMode: boolean = typeof localStorage !== 'undefined' && localStorage.getItem('app_language') === 'ar';
  windowWidth: number = window.innerWidth;
  isMobileNav = false;
  protected readonly oosm_menus = oosm_menus;
  protected readonly defaultLogoMark = APP_LOGO_MARK;
  private breakpointObserver = inject(BreakpointObserver);
  private themeService = inject(ThemeLayoutService);
  private cdr: ChangeDetectorRef;
  private destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
    effect(() => {
      this.themeDirection(this.themeService.directionChange());
    });
    effect(() => {
      this.syncMobileNavState();
    });
    this.cdr = inject(ChangeDetectorRef);
  }
// wherever you handle “Apply” in your config UI, call:
  onApply(cfg: ThemeConfig) {
    this.themeConfig.saveConfig(cfg);
    this.themeConfig.applyConfig(cfg);
  }
  // life cycle event
  logoPreview: string | null = null;
  companyName = '';
  ngOnInit() {
    const cfg = this.themeConfig.loadConfig();
    this.themeConfig.applyConfig(cfg);
    this.currentLayout = cfg.layout;
    this.rtlMode = cfg.rtlLayout;
    this.manageLayout(cfg.layout);

    this.themeService.mobileViewport.set(this.windowWidth <= 1024);

    this.breakpointObserver
      .observe([MIN_WIDTH_1025PX, MAX_WIDTH_1024PX])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.themeService.mobileViewport.set(!!result.breakpoints[MAX_WIDTH_1024PX]);
      });

    /**
     * Dashboard menu sidebar toggle listener
     */
    this.themeService.dashBoardMenuState.subscribe(() => {
      if (!this.isMobileNav) {
        this.sidebar()?.toggle();
      }
    });

    // Load company profile and logo
    this.loadCompanyProfile();

    if (this.authenticationService.currentUserValue) {
      this.notificationService.startPolling();
      void this.pushNotificationService.initAfterLogin();
    }

    this.buildMenus();
    this.authenticationService.permissionsChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildMenus();
        this.cdr.detectChanges();
      });
  }

  get isAdminSection(): boolean {
    return this.authenticationService.currentUserValue?.role === Role.OosmAdmin;
  }

  private syncMobileNavState(): void {
    const mobileViewport = this.themeService.mobileViewport();
    const bottomNavEnabled = this.themeService.mobileBottomNavEnabled();
    const mobile = mobileViewport && bottomNavEnabled;

    this.isMobileNav = mobile;
    this.themeService.isMobileNav.set(mobile);
    this.modeValue = mobileViewport ? 'over' : 'side';
    this.manageLayout(this.currentLayout);
    document.body.classList.toggle('mobile-nav-active', mobile);
  }

  private buildMenus(): void {
    const currentUser = this.authenticationService.currentUserValue;
    const isAdminSection = currentUser?.role === Role.OosmAdmin;
    this.menus = structuredClone(isAdminSection ? admin_menus : oosm_menus);

    if (!this.authenticationService.isAdmin()) {
      this.menus = filterMenuByPermissions(
        this.menus,
        currentUser?.permissions,
        {
          bypassPermissionChecks: false,
          enabledModules: this.authenticationService.getTenantEnabledModules()
        }
      );
    } else {
      this.menus = filterMenuByPermissions(
        this.menus,
        currentUser?.permissions,
        {
          bypassPermissionChecks: true,
          enabledModules: this.authenticationService.getTenantEnabledModules()
        }
      );
    }
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }


  private loadCompanyProfile(): void {
    const currentUser = this.authenticationService.currentUserValue;
    if (currentUser?.role === Role.OosmAdmin) {
      this.logoPreview = null;
      this.companyName = '';
      return;
    }

    const cached = this.companyProfileService.getProfileFromCache();
    if (cached) {
      this.applyCompanyProfile(cached);
    }

    if (cached && this.companyProfileService.isProfileCacheFresh()) {
      return;
    }

    this.companyProfileService
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.applyCompanyProfile(profile),
        error: () => undefined
      });
  }

  private applyCompanyProfile(profile: CompanyProfile): void {
    this.companyName = profile.legalName?.trim() || '';
    this.logoPreview = this.companyProfileService.getLogoDataUrlFromCache() ?? this.buildLogoUrl(profile);
    if (profile.enabledModules) {
      this.authenticationService.setTenantEnabledModules(profile.enabledModules);
    }
    this.cdr.markForCheck();
  }

  private buildLogoUrl(profile: CompanyProfile | null): string | null {
    if (!profile?.logoData) {
      return null;
    }
    if (profile.logoData.startsWith('data:')) {
      return profile.logoData;
    }
    if (profile.logoContentType) {
      return `data:${profile.logoContentType};base64,${profile.logoData}`;
    }
    return profile.logoData;
  }

  /**
   * Listen to Theme direction change. RTL/LTR
   */
  private themeDirection(direction: string) {
    this.rtlMode = direction === RTL ? true : false;
    this.manageLayout(this.currentLayout);
  }

  /**
   * Listen to theme layout changes
   */
  private updateThemeLayout(layout: string) {
    if (!layout) {
      return;
    }
    this.currentLayout = layout as string;
    this.manageLayout(layout);
  }

  /**
   * Manage layout of theme
   */
  private manageLayout(layout: string) {
    const drawerContent = document.querySelector('.mat-drawer-content') as HTMLElement;
    if (drawerContent) {
      if (this.isMobileNav || this.windowWidth <= 1025) {
        drawerContent.style.marginLeft = '0px';
        drawerContent.style.marginRight = '0px';
        this.direction = this.rtlMode === true ? RTL : LTR;
        return;
      }

      if (layout === VERTICAL) {
        drawerContent.style.marginLeft = this.rtlMode === true ? '0px' : '280px';
        drawerContent.style.marginRight = this.rtlMode === true ? '280px' : '0px';
        this.direction = this.rtlMode === true ? RTL : LTR;
      } else if (layout === COMPACT) {
        drawerContent.style.marginLeft = this.rtlMode == true ? '0px' : '90px';
        drawerContent.style.marginRight = this.rtlMode == true ? '90px' : '0px';
        this.direction = this.rtlMode == true ? RTL : LTR;
      } else if (layout == HORIZONTAL) {
        drawerContent.style.marginLeft = '0px';
        drawerContent.style.marginRight = '0px';
        this.direction = LTR;
      }
    }
  }
}
