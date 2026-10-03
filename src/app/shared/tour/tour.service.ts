import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { driver, DriveStep, Driver } from 'driver.js';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthenticationService } from 'src/app/auth/services/authentication.service';
import {
  elementStepKey,
  findModuleTour,
  SHELL_TARGETS,
  SHELL_TOUR_ID,
  SHELL_TOUR_VERSION,
  STEP_TARGETS,
  TourDefinition
} from './tour.registry';

const STORAGE_PREFIX = 'oosm.tours.v1.';
const PAGE_SETTLE_TIMEOUT_MS = 5000;
const PAGE_SETTLE_POLL_MS = 250;
const BUSY_SELECTORS = '.page-wrapper mat-spinner, .page-wrapper mat-progress-spinner, .page-wrapper .mat-mdc-progress-bar';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthenticationService);

  private active: Driver | null = null;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  /** Called once by the main layout; tours then start on their own after each navigation. */
  init(destroyRef: DestroyRef): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((event) => this.scheduleAutoStart(event.urlAfterRedirects));
    destroyRef.onDestroy(() => {
      this.cancelPending();
      this.active?.destroy();
      this.initialized = false;
    });
    this.scheduleAutoStart(this.router.url);
  }

  /** Replays the tour of the current page, or the app overview when the page has none. */
  replay(): void {
    const tour = findModuleTour(this.router.url);
    void this.start(tour, !tour);
  }

  /** Forgets every tour seen by this user and starts again from the app overview. */
  restartAll(): void {
    const key = this.storageKey();
    if (key) {
      localStorage.removeItem(key);
    }
    void this.start(findModuleTour(this.router.url), true);
  }

  private scheduleAutoStart(url: string): void {
    this.cancelPending();
    if (this.active || !this.auth.currentUserValue || url.startsWith('/access-denied') || url.startsWith('/help')) {
      return;
    }
    const tour = findModuleTour(url);
    const showShell = !this.isSeen(SHELL_TOUR_ID, SHELL_TOUR_VERSION);
    const showModule = !!tour && !this.isSeen(tour.id, tour.version);
    if (!showShell && !showModule) {
      return;
    }
    const startedAt = Date.now();
    const poll = () => {
      if (this.router.url.split(/[?#]/)[0] !== url.split(/[?#]/)[0]) {
        return;
      }
      if (!this.pageSettled() && Date.now() - startedAt < PAGE_SETTLE_TIMEOUT_MS) {
        this.pendingTimer = setTimeout(poll, PAGE_SETTLE_POLL_MS);
        return;
      }
      this.pendingTimer = null;
      void this.start(showModule ? tour : undefined, showShell);
    };
    this.pendingTimer = setTimeout(poll, 600);
  }

  private async start(tour: TourDefinition | undefined, includeShell: boolean): Promise<void> {
    this.cancelPending();
    this.active?.destroy();
    if (document.querySelector('.cdk-overlay-container .mat-mdc-dialog-container')) {
      return;
    }
    await firstValueFrom(this.translate.get('TOUR.NEXT'));

    const steps: DriveStep[] = [];
    if (includeShell) {
      steps.push(...this.shellSteps());
    }
    if (tour) {
      steps.push(...this.moduleSteps(tour, includeShell));
    }
    if (!steps.length) {
      return;
    }

    const rtl = (this.translate.currentLang || this.translate.defaultLang) === 'ar';
    this.active = driver({
      steps,
      showProgress: steps.length > 1,
      progressText: this.translate.instant('TOUR.PROGRESS'),
      nextBtnText: this.translate.instant('TOUR.NEXT'),
      prevBtnText: this.translate.instant('TOUR.PREVIOUS'),
      doneBtnText: this.translate.instant('TOUR.DONE'),
      popoverClass: 'oosm-tour',
      overlayOpacity: 0.5,
      stagePadding: 6,
      stageRadius: 10,
      smoothScroll: true,
      allowClose: true,
      onPopoverRender: (popover) => popover.wrapper.setAttribute('dir', rtl ? 'rtl' : 'ltr'),
      onDestroyed: () => {
        if (includeShell) {
          this.markSeen(SHELL_TOUR_ID, SHELL_TOUR_VERSION);
        }
        if (tour) {
          this.markSeen(tour.id, tour.version);
        }
        this.active = null;
      }
    });
    this.active.drive();
  }

  private shellSteps(): DriveStep[] {
    const steps: DriveStep[] = [this.step(undefined, 'TOUR.SHELL.TITLE', 'TOUR.SHELL.INTRO')];
    for (const target of SHELL_TARGETS) {
      const element = this.visible(target.selector);
      if (element) {
        steps.push(this.step(element, `TOUR.SHELL.${target.key}_TITLE`, `TOUR.SHELL.${target.key}`));
      }
    }
    return steps;
  }

  private moduleSteps(tour: TourDefinition, afterShell: boolean): DriveStep[] {
    const steps: DriveStep[] = [];
    for (const entry of tour.steps) {
      if (entry === 'intro') {
        steps.push(this.step(undefined, `TOUR.${tour.id}.TITLE`, `TOUR.${tour.id}.INTRO`));
        continue;
      }
      if (entry === 'replay' && afterShell) {
        continue;
      }
      const element =
        typeof entry === 'string'
          ? STEP_TARGETS[entry].map((selector) => this.visible(selector)).find((el) => !!el)
          : this.visible(`[data-tour="${entry.target}"]`);
      const key = typeof entry === 'string' ? entry.toUpperCase() : elementStepKey(entry);
      if (element && !steps.some((s) => s.element === element)) {
        steps.push(this.step(element, this.textKey(tour, `${key}_TITLE`), this.textKey(tour, key)));
      }
    }
    return steps;
  }

  /** Module-specific wording when the tour defines it, generic wording otherwise. */
  private textKey(tour: TourDefinition, key: string): string {
    const specific = `TOUR.${tour.id}.${key}`;
    return this.translate.instant(specific) !== specific ? specific : `TOUR.STEP.${key}`;
  }

  private step(element: Element | undefined, titleKey: string, bodyKey: string): DriveStep {
    return {
      element,
      popover: {
        title: this.translate.instant(titleKey),
        description: this.translate.instant(bodyKey)
      }
    };
  }

  private visible(selector: string): Element | undefined {
    for (const element of Array.from(document.querySelectorAll(selector))) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return element;
      }
    }
    return undefined;
  }

  private pageSettled(): boolean {
    const page = document.querySelector('.page-wrapper');
    return !!page && page.children.length > 1 && !document.querySelector(BUSY_SELECTORS);
  }

  private cancelPending(): void {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  private storageKey(): string | null {
    const userId = this.auth.currentUserValue?.id;
    return userId ? `${STORAGE_PREFIX}${userId}` : null;
  }

  private seen(): string[] {
    const key = this.storageKey();
    if (!key) {
      return [];
    }
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private isSeen(id: string, version: number): boolean {
    return this.seen().includes(`${id}@${version}`);
  }

  private markSeen(id: string, version: number): void {
    const key = this.storageKey();
    if (!key) {
      return;
    }
    const entries = this.seen().filter((entry) => !entry.startsWith(`${id}@`));
    entries.push(`${id}@${version}`);
    localStorage.setItem(key, JSON.stringify(entries));
  }
}
