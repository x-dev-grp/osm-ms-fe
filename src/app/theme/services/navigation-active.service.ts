import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { NavigationItem } from '../types/navigation';
import { isNavigationItemActive, isNavigationUrlActive, normalizeNavigationUrl } from '../utils/navigation-active.util';

@Injectable({
  providedIn: 'root'
})
export class NavigationActiveService {
  private readonly router = inject(Router);
  private readonly currentUrlState = signal(normalizeNavigationUrl(this.router.url));

  readonly currentUrl = this.currentUrlState.asReadonly();

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrlState.set(normalizeNavigationUrl(event.urlAfterRedirects));
      });
  }

  isRouteActive(menuUrl?: string, exactMatch = false): boolean {
    return isNavigationUrlActive(this.currentUrlState(), menuUrl, exactMatch);
  }

  isItemActive(item: NavigationItem | undefined): boolean {
    return isNavigationItemActive(item, this.currentUrlState());
  }
}
