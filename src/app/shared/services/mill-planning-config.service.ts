import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, shareReplay, Subject, tap } from 'rxjs';
import { TenantParameterClient } from './tenant-parameter.client';

export const ENABLE_MILL_PLANNING_CODE = 'ENABLE_MILL_PLANNING';

/**
 * Cached tenant flag for the mill kanban planning board.
 * When false, operators complete lots from reception lists and assign the mill in the dialog.
 */
@Injectable({ providedIn: 'root' })
export class MillPlanningConfigService {
  private readonly params = inject(TenantParameterClient);
  private readonly changedSubject = new Subject<boolean>();

  /** Emits whenever the flag is updated locally (e.g. after saving the parameter). */
  readonly changes$ = this.changedSubject.asObservable();

  /** Latest known value (defaults to true until first fetch). */
  readonly enabled = signal(true);

  private cached$?: Observable<boolean>;

  isEnabled(forceRefresh = false): Observable<boolean> {
    if (forceRefresh) {
      this.cached$ = undefined;
    }
    if (!this.cached$) {
      this.cached$ = this.params.getBoolean(ENABLE_MILL_PLANNING_CODE, true).pipe(
        tap((value) => this.enabled.set(value)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.cached$;
  }

  /** Call after saving ENABLE_MILL_PLANNING so menu / guards pick up the new value. */
  invalidate(): void {
    this.cached$ = undefined;
  }

  setLocalEnabled(value: boolean): void {
    this.enabled.set(value);
    this.cached$ = of(value).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.changedSubject.next(value);
  }
}
