// Angular import
import { AfterViewInit, Component, effect, inject, OnInit, viewChild, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDrawer, MatDrawerMode } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// Project import
import { AbleProConfig } from 'src/app/app-config';
import { ThemeLayoutService } from 'src/app/theme/services/theme-layout.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavBarComponent } from 'src/app/theme/layouts/toolbar/toolbar.component';
import { VerticalMenuComponent } from 'src/app/theme/layouts/menu/vertical-menu';

import { BreadcrumbComponent } from 'src/app/theme/components/breadcrumb/breadcrumb.component';
import { FooterComponent } from 'src/app/theme/layouts/footer/footer.component';

// service
 import { AuthenticationService } from 'src/app/auth/services/authentication.service';

// const import
import { COMPACT, HORIZONTAL, LTR, MAX_WIDTH_1024PX, MIN_WIDTH_1025PX, RTL, VERTICAL } from 'src/app/theme/const';

// theme version
import { environment } from 'src/environments/environment';

//type
import { Navigation } from 'src/app/theme/types/navigation';
import { Role } from 'src/app/theme/types/role';
import { osm_menus } from '../../../shared/osm_menu';
import { admin_menus } from '../../../shared/admin_menu';
import { Router } from '@angular/router';
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

    BreadcrumbComponent,
     FooterComponent
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
   authenticationService = inject(AuthenticationService);
  companyProfileService = inject(CompanyProfileService);
  private themeConfig = inject(ThemeConfigService);
  private router = inject(Router);
// public props
  readonly sidebar = viewChild<MatDrawer>('sidebar');
  menus: Navigation[] = [];
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
  private cdr: ChangeDetectorRef;

  // Constructor
  constructor() {
    effect(() => {
      this.updateThemeLayout(this.themeService.layout());
    });
    effect(() => {
      this.themeDirection(this.themeService.directionChange());
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

    // Load company profile and logo
    this.loadCompanyLogoFromCache();


    /**
     * current login user role
     */
    const currentUser = this.authenticationService.currentUserValue;
    const userRole = currentUser?.role? currentUser.role : Role.Admin;
    const userPermissions = currentUser?.permissions || [];
    // Use admin_menus if in administration section, else osm_menus
   //todo enable it after back end imple
    const isAdminSection = currentUser?.role===Role.OsmAdmin;
   //  const isAdminSection = this.router.url.startsWith('/administration');
    this.menus = structuredClone(isAdminSection ? admin_menus : osm_menus);

    // const permissionModules:string[] = Array.from(new Set(userPermissions?.map((p:string) => p.split(':')[0])));
    // const permissionRessources:string[] = Array.from(new Set(userPermissions?.map((p:string)=> p.split(':')[1])));

    /**
     * Role base menu filtering
     */
    if(userRole !== Role.Admin)
       this.menus = this.filterMenuByPermissions(this.menus, userPermissions);
  }
filterMenuByPermissions(
  menuItems: Navigation[],
  userPermissions: string[]
): Navigation[] {
  const permissionSet = new Set(userPermissions);

  const hasAccess = (item: Navigation): boolean => {
    if (item.permissions) {
      return item.permissions?.some((p:string) => permissionSet.has(p.toUpperCase()));
    }

    if (item.modulePermission || item.ressourcePermission) {
      return Array.from(permissionSet)?.some((p:string) => {
        const [module, resource] = p.split(':');
        return (
          (!item.modulePermission || item.modulePermission?.toUpperCase() === module) &&
          (!item.ressourcePermission || item.ressourcePermission?.toUpperCase() === resource)
        );
      });
    }

    return true;
  };

 const processItem = (
    item: Navigation,
    parentDisabled=false
  ): Navigation => {
    const copy: Navigation = { ...item };

    const itemHasAccess = hasAccess(copy);
    const isDisabled = parentDisabled || !itemHasAccess;
    copy.disabled = isDisabled;

    if (copy.children && copy.children.length > 0) {
      copy.children = copy.children.map(child =>
        processItem(child, isDisabled)
      );
    }

    return copy;
  };

 return menuItems.map(item => processItem(item, false));

}
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
  ngAfterViewInit() {
    const cfg = this.themeConfig.loadConfig();
    this.themeConfig.applyConfig(cfg);
    // now your currentLayout/rtlMode etc can read from cfg:
    this.rtlMode = cfg.rtlLayout;
    this.currentLayout = cfg.layout;
    this.manageLayout(this.currentLayout);
    this.cdr.detectChanges();
  }


  private applySavedTheme(): void {
    // AbleProConfig has already been seeded from localStorage in your config component
    // We simply read the static fields here:

    // 1) Light/Dark/Auto
    document.body.classList.remove('light','dark');
    if (AbleProConfig.isDarkMode === 'light') document.body.classList.add('light');
    if (AbleProConfig.isDarkMode === 'dark')  document.body.classList.add('dark');
    // (auto you'd handle separately if desired)

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
    this.currentLayout = AbleProConfig.layout as string;
  }

  // ────────────────────────────────────
  // EXISTING METHODS (UNCHANGED)
  // ────────────────────────────────────

  /**
   * Loads company profile and logo from API or cache
   */
  private loadCompanyProfileAndLogo(): void {
    const currentUser = this.authenticationService.currentUserValue;

    // Only fetch company profile for non-OsmAdmin users who have a tenantId
    if (currentUser && currentUser.role !== Role.OsmAdmin && currentUser.tenantId) {
      console.log('[AdminComponent] Fetching company profile for tenantId:', currentUser.tenantId);
      this.loadCompanyLogoFromCache();

    } else {
      console.log('[AdminComponent] Skipping company profile fetch - user is OsmAdmin or has no tenantId');
    }
  }

  /**
   * Loads company logo from localStorage cache (fallback method)
   */
  private loadCompanyLogoFromCache(): void {
    // Try to get company profile from localStorage
    const cachedProfile = localStorage.getItem('company_profile');
    if (cachedProfile) {

        const parsed = JSON.parse(cachedProfile);
        if (parsed) {
          this.profile = parsed;
          if (this.profile.logoData && this.profile.logoContentType) {
            this.logoPreview = `data:${this.profile.logoContentType};base64,${this.profile.logoData}`;
          }
        }

    }else {
      this.companyProfileService.getProfile;
    }
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
    this.currentLayout = layout as string;
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
