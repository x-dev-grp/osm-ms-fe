import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  constructor(
    private swUpdate: SwUpdate,
    private snackBar: MatSnackBar
  ) {
    this.checkForUpdates();
  }

  public checkForUpdates(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(evt => ({
            type: 'UPDATE_AVAILABLE',
            current: evt.currentVersion,
            available: evt.latestVersion,
          }))
        )
        .subscribe(evt => {
          const snackBarRef = this.snackBar.open(
            'A new version is available. Would you like to update?',
            'Update',
            {
              duration: 0,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            }
          );

          snackBarRef.onAction().subscribe(() => {
            window.location.reload();
          });
        });
    }
  }

  public async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      try {
        const updateFound = await this.swUpdate.checkForUpdate();
        if (updateFound) {
          this.snackBar.open('Update available!', 'OK', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      } catch (err) {
        console.error('Error checking for updates:', err);
      }
    }
  }
} 