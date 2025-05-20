// Angular import
import { AfterViewInit, Component, effect, inject, OnInit, viewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawer, MatDrawerMode } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Project import
import { AbleProConfig } from 'src/app/app-config';
import { ThemeLayoutService } from 'src/app/@theme/services/theme-layout.service';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { NavBarComponent } from 'src/app/@theme/layouts/toolbar/toolbar.component';
import { VerticalMenuComponent } from 'src/app/@theme/layouts/menu/vertical-menu';
import { HorizontalMenuComponent } from 'src/app/@theme/layouts/menu/horizontal-menu';
import { CompactMenuComponent } from 'src/app/@theme/layouts/menu/compact-menu';
import { BreadcrumbComponent } from 'src/app/@theme/components/breadcrumb/breadcrumb.component';
import { ConfigurationComponent } from 'src/app/@theme/layouts/configuration/configuration.component';
import { FooterComponent } from 'src/app/@theme/layouts/footer/footer.component';

// service
import { BuyNowLinkService } from 'src/app/@theme/services/buy-now-link.service';
import { AuthenticationService } from 'src/app/auth/services/authentication.service';

// const import
import { COMPACT, HORIZONTAL, LTR, MAX_WIDTH_1024PX, MIN_WIDTH_1025PX, RTL, VERTICAL } from 'src/app/@theme/const';

// theme version
import { environment } from 'src/environments/environment';

//type
import { Navigation } from 'src/app/@theme/types/navigation';
import { Role } from 'src/app/@theme/types/role';
import { osm_menus } from '../../../shared/osm_menu';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { ThemeConfig, ThemeConfigService } from '../../../shared/services/theme-config.service';

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
    CompactMenuComponent,
    BreadcrumbComponent,
    ConfigurationComponent,
    FooterComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
  buyNowLinkService = inject(BuyNowLinkService);
  authenticationService = inject(AuthenticationService);
  companyProfileService = inject(CompanyProfileService);
  private themeConfig = inject(ThemeConfigService);
// public props
  readonly sidebar = viewChild<MatDrawer>('sidebar');
  menus: Navigation[] = osm_menus;
  modeValue: MatDrawerMode = 'side';
  direction: string = 'ltr';
  currentApplicationVersion = environment.appVersion;
  currentLayout: string = 'vertical';
  rtlMode: boolean = false;
  windowWidth: number = window.innerWidth;
  protected readonly osm_menus = osm_menus;
  private breakpointObserver = inject(BreakpointObserver);
  private themeService = inject(ThemeLayoutService);
  private profile: CompanyProfile;

  // Constructor
  constructor() {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
    effect(() => {
      this.themeDirection(this.themeService.directionChange());
    });
  }
// wherever you handle “Apply” in your config UI, call:
  onApply(cfg: ThemeConfig) {
    this.themeConfig.saveConfig(cfg);
    this.themeConfig.applyConfig(cfg);
  }
  // life cycle event
  logoPreview: string | null = null;
  ngOnInit() {
  const cfg = this.themeConfig.loadConfig();
   this.themeConfig.applyConfig(cfg)
   this.breakpointObserver.observe([MIN_WIDTH_1025PX, MAX_WIDTH_1024PX]).subscribe((result) => {
      if (result.breakpoints[MAX_WIDTH_1024PX]) {
        this.modeValue = 'over';
      } else if (result.breakpoints[MIN_WIDTH_1025PX]) {
        this.modeValue = 'side';
      }
    });

    /**
     * Dashboard menu sidebar toggle listener
     */
    this.themeService.dashBoardMenuState.subscribe(() => {
      this.sidebar()!.toggle();
    });
    this.loadProfile();
    /**
     * current login user role
     */
    const currentUser = this.authenticationService.currentUserValue;
    const userRoles = currentUser?.role? [currentUser.role] : [Role.Admin];

    /**
     * Role base menu filtering
     */
    this.menus = this.RoleBaseFilterMenu(osm_menus, userRoles);
  }

  ngAfterViewInit() {
    const cfg = this.themeConfig.loadConfig();
    this.themeConfig.applyConfig(cfg);
    // now your currentLayout/rtlMode etc can read from cfg:
    this.rtlMode = cfg.rtlLayout;
    this.currentLayout = cfg.layout;
    this.manageLayout(this.currentLayout);
  }


  private applySavedTheme(): void {
    // AbleProConfig has already been seeded from localStorage in your config component
    // We simply read the static fields here:

    // 1) Light/Dark/Auto
    document.body.classList.remove('light','dark');
    if (AbleProConfig.isDarkMode === 'light') document.body.classList.add('light');
    if (AbleProConfig.isDarkMode === 'dark')  document.body.classList.add('dark');
    // (auto you’d handle separately if desired)

    // 2) Contrast
    document.body.classList.toggle('gray-contrast', !AbleProConfig.theme_contrast);

    // 3) Sidebar caption
    document.body.classList.toggle('hide-caption', AbleProConfig.menu_caption);

    // 4) RTL/LTR
    this.rtlMode = AbleProConfig.isRtlLayout;
    document.body.dir = this.rtlMode ? 'rtl' : 'ltr';

    // 5) Primary color
    const themes = [
      'blue-theme','indigo-theme','purple-theme','pink-theme',
      'red-theme','orange-theme','yellow-theme','green-theme',
      'teal-theme','cyan-theme'
    ];
    document.body.classList.remove(...themes);
    document.body.classList.add(AbleProConfig.theme_color);

    // 6) Boxed vs full container
    document.body.classList.toggle('boxed', AbleProConfig.isBox_container);

    // 7) Menu layout
    this.currentLayout = AbleProConfig.layout as any;
  }

  // ────────────────────────────────────
  // EXISTING METHODS (UNCHANGED)
  // ────────────────────────────────────

  RoleBaseFilterMenu(menus: Navigation[], userRoles: string[], parentRoles: string[] = [Role.Admin]): Navigation[] {
    return menus.map((item) => {
      // If item doesn't have a specific role, inherit roles from parent
      const itemRoles = item.role ? item.role : parentRoles;

      // If item has children, recursively filter them, passing current item's roles as parentRoles
      if (item.children) {
        item.children = this.RoleBaseFilterMenu(item.children, userRoles, itemRoles);
      }

      return item; // Return the item whether it is visible or disabled
    });
  }

  private loadProfile(): void {
    this.companyProfileService.getProfile().subscribe(
      (res) => {
        if (res && res.success) {
          this.profile = res?.data[0];

          if (this.profile?.logoData && this.profile?.logoContentType) {
            this.logoPreview = `data:${this.profile?.logoContentType};base64,${this.profile?.logoData}`;
          }
        }
      },
      (err) => console.error('Error loading deliveries', err)
    );
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
    this.currentLayout = layout as any;
    this.manageLayout(layout);
  }

  /**
   * Manage layout of theme
   */
  private manageLayout(layout: string) {
    const drawerContent = document.querySelector('.mat-drawer-content') as HTMLElement;
    if (drawerContent) {
      if (layout === VERTICAL) {
        if (this.windowWidth > 1025) {
          drawerContent.style.marginLeft = this.rtlMode === true ? '0px' : '280px';
          drawerContent.style.marginRight = this.rtlMode === true ? '280px' : '0px';
        }
        this.direction = this.rtlMode === true ? RTL : LTR;
      } else if (layout === COMPACT) {
        if (this.windowWidth > 1025) {
          drawerContent.style.marginLeft = this.rtlMode == true ? '0px' : '90px';
          drawerContent.style.marginRight = this.rtlMode == true ? '90px' : '0px';
        }
        this.direction = this.rtlMode == true ? RTL : LTR;
      } else if (layout == HORIZONTAL) {
        drawerContent.style.marginLeft = '0px';
      }
    }
  }
}
