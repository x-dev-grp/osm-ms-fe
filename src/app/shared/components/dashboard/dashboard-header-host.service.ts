import { Injectable, signal } from '@angular/core';
import { Portal } from '@angular/cdk/portal';

/**
 * Provided by a container (e.g. the dashboard hub) that renders its own page header.
 * Embedded dashboard shells hide their header card and hand their toolbar to this host instead.
 */
@Injectable()
export class DashboardHeaderHost {
  private readonly current = signal<Portal<unknown> | null>(null);

  readonly portal = this.current.asReadonly();

  attach(portal: Portal<unknown>): void {
    this.current.set(portal);
  }

  detach(portal: Portal<unknown>): void {
    if (this.current() === portal) {
      this.current.set(null);
    }
  }
}
