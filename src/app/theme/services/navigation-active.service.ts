import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { NavigationItem } from '../types/navigation';
import {
  collectNavigationUrls,
  findBestMatchingNavigationUrl,
  isNavigationItemActive,
  isNavigationUrlActive,
  normalizeNavigationUrl
} from '../utils/navigation-active.util';

@Injectable({
  providedIn: 'root'
})
export class NavigationActiveService {
  private readonly router = inject(Router);
  private readonly currentUrlState = signal(normalizeNavigationUrl(this.router.url));
  private readonly menuUrlsState = signal<string[]>([]);
  private readonly activeMenuUrlState = signal<string | null>(findBestMatchingNavigationUrl(this.router.url, []));

  readonly currentUrl = this.currentUrlState.asReadonly();
  readonly activeMenuUrl = this.activeMenuUrlState.asReadonly();

  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.updateCurrentUrl(normalizeNavigationUrl(event.urlAfterRedirects));
    });
  }

  setMenuItems(items: NavigationItem[] | undefined): void {
    const urls = collectNavigationUrls(items);
    this.menuUrlsState.set(urls);
    this.updateActiveMenuUrl(this.currentUrlState());
  }

  isRouteActive(menuUrl?: string, exactMatch = false): boolean {
    return isNavigationUrlActive(this.currentUrlState(), menuUrl, exactMatch, exactMatch ? undefined : this.activeMenuUrlState());
  }

  isItemActive(item: NavigationItem | undefined): boolean {
    return isNavigationItemActive(item, this.currentUrlState(), this.activeMenuUrlState());
  }

  private updateCurrentUrl(url: string): void {
    this.currentUrlState.set(url);
    this.updateActiveMenuUrl(url);
  }

  private updateActiveMenuUrl(url: string): void {
    this.activeMenuUrlState.set(findBestMatchingNavigationUrl(url, this.menuUrlsState()));
  }
}
