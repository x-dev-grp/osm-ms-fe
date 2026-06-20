import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private bp = inject(BreakpointObserver);

  /** True when viewport is handset-sized (phones) */
  private isHandset = false;

  /** Base defaults (desktop/tablet) */
  private baseConfig: MatSnackBarConfig = {
    duration: 3500,
    horizontalPosition: 'right', // desktop/tablet
    verticalPosition: 'top', // desktop/tablet
    panelClass: ['app-toast']
  };

  constructor() {
    // Treat Handset *or* Small as "mobile"
    this.bp.observe([Breakpoints.Handset, Breakpoints.Small]).subscribe((state) => {
      this.isHandset = state.matches;
    });
  }

  /** Merge config with responsive overrides (bottom on mobile) */
  private withViewport(config?: MatSnackBarConfig): MatSnackBarConfig {
    const merged = { ...this.baseConfig, ...(config || {}) };

    if (this.isHandset) {
      // Force bottom on mobile, center is nicer on phones
      merged.verticalPosition = 'bottom';
      merged.horizontalPosition = 'center';

      // Ensure our base class is present; keep any custom classes
      const classes = new Set<string>(
        Array.isArray(merged.panelClass) ? (merged.panelClass as string[]) : merged.panelClass ? [merged.panelClass as string] : []
      );
      classes.add('app-toast');
      classes.add('app-toast-mobile'); // optional helper class for mobile styling
      merged.panelClass = Array.from(classes);
    }

    return merged;
  }

  open(message: string, action?: string, config?: MatSnackBarConfig, interpolateParams?: Record<string, unknown>) {
    const translatedParams = interpolateParams
      ? Object.fromEntries(
          Object.entries(interpolateParams).map(([key, value]) => [key, typeof value === 'string' ? this.translate.instant(value) : value])
        )
      : undefined;
    const translatedMessage = this.translate.instant(message, translatedParams);
    return this.snackBar.open(
      this.translate.instant(translatedMessage, translatedParams),
      action ? this.translate.instant(action) : undefined,
      this.withViewport(config)
    );
  }

  success(message?: string, interpolateParams?: Record<string, unknown>) {
    return this.open(
      message || 'OSM_DASHBOARD.ACTIONS.SUCCESS',
      'COMMON.CLOSE',
      { panelClass: ['app-toast', 'app-toast-success'] },
      interpolateParams
    );
  }

  error(message: string, interpolateParams?: Record<string, unknown>) {
    const duration = Math.min(Math.max(message.length * 45, 5000), 12000);
    return this.open(
      message,
      'COMMON.CLOSE',
      {
        duration,
        panelClass: ['app-toast', 'app-toast-error']
      },
      interpolateParams
    );
  }

  info(message: string, interpolateParams?: Record<string, unknown>) {
    return this.open(message, 'COMMON.CLOSE', { panelClass: ['app-toast', 'app-toast-info'] }, interpolateParams);
  }

  warning(message: string, interpolateParams?: Record<string, unknown>) {
    return this.open(message, 'COMMON.CLOSE', { panelClass: ['app-toast', 'app-toast-warning'] }, interpolateParams);
  }
}
