import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });
  private readonly toast = inject(ToastService);

  init(): void {
    if (!this.swUpdate?.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.info('PWA.UPDATE_AVAILABLE');
      });

    this.swUpdate.unrecoverable.subscribe(() => {
      this.toast.error('PWA.UNRECOVERABLE_ERROR');
      window.location.reload();
    });
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate?.isEnabled) {
      return;
    }
    await this.swUpdate.activateUpdate();
    window.location.reload();
  }
}
