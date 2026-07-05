import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import { Navigation } from '../../types/navigation';
import {
  ADMIN_MOBILE_NAV_TABS,
  ADMIN_MOBILE_PRIMARY_URLS,
  findMenuGroupById,
  getAdminMoreMenuItems,
  getMoreMenuGroups,
  MOBILE_NAV_MORE_TAB_ID,
  MobileNavTab,
  OOSM_MOBILE_NAV_TABS,
  OOSM_MOBILE_PRIMARY_GROUP_IDS,
  resolveMobileNavTabId,
  wrapMenuItemsAsGroup
} from '../../../shared/constants/mobile-nav.config';
import { MobileMenuSheetComponent, MobileMenuSheetData } from './mobile-menu-sheet.component';

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  imports: [SharedModule, TranslateModule],
  templateUrl: './mobile-bottom-nav.component.html',
  styleUrl: './mobile-bottom-nav.component.scss'
})
export class MobileBottomNavComponent implements OnInit {
  readonly menus = input.required<Navigation[]>();
  readonly isAdmin = input(false);

  private readonly router = inject(Router);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  readonly moreTabId = MOBILE_NAV_MORE_TAB_ID;
  activeTabId = MOBILE_NAV_MORE_TAB_ID;
  primaryTabs: MobileNavTab[] = OOSM_MOBILE_NAV_TABS;

  ngOnInit(): void {
    this.primaryTabs = this.isAdmin() ? ADMIN_MOBILE_NAV_TABS : OOSM_MOBILE_NAV_TABS;
    this.syncActiveTab(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => this.syncActiveTab(event.urlAfterRedirects));
  }

  isActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }

  onTabClick(tab: MobileNavTab): void {
    this.activeTabId = tab.id;

    if (tab.menuGroupId) {
      const group = findMenuGroupById(this.menus(), tab.menuGroupId);
      if (group) {
        this.openMenuSheet({
          menus: [group],
          titleKey: tab.labelKey
        });
        return;
      }
    }

    if (tab.url) {
      void this.router.navigateByUrl(tab.url);
    }
  }

  openMoreMenu(): void {
    this.activeTabId = MOBILE_NAV_MORE_TAB_ID;

    if (this.isAdmin()) {
      const moreItems = getAdminMoreMenuItems(this.menus(), ADMIN_MOBILE_PRIMARY_URLS);
      this.openMenuSheet({
        menus: wrapMenuItemsAsGroup(moreItems, 'MENU.ADMINISTRATION.TITLE', 'oosm-admin-more'),
        titleKey: 'MOBILE_NAV.MORE'
      });
      return;
    }

    const moreGroups = getMoreMenuGroups(this.menus(), OOSM_MOBILE_PRIMARY_GROUP_IDS);
    this.openMenuSheet({
      menus: moreGroups,
      titleKey: 'MOBILE_NAV.MORE'
    });
  }

  private openMenuSheet(data: MobileMenuSheetData): void {
    this.bottomSheet.open(MobileMenuSheetComponent, {
      data,
      panelClass: 'mobile-menu-sheet-panel',
      autoFocus: false
    });
  }

  private syncActiveTab(url: string): void {
    this.activeTabId = resolveMobileNavTabId(url, this.primaryTabs);
  }
}
