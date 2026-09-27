import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { SharedModule } from '../../shared/shared.module';
import { AuthenticationService } from '../../auth/services/authentication.service';
import {
  DayImportDriveStatus,
  DayImportReport,
  DayImportReportFormat,
  DayImportRow,
  ReceptionImportService
} from './reception-import.service';

@Component({
  selector: 'app-reception-import-wizard',
  standalone: true,
  imports: [CommonModule, SharedModule, MatSnackBarModule],
  templateUrl: './reception-import-wizard.component.html',
  styleUrls: ['./reception-import-wizard.component.scss']
})
export class ReceptionImportWizardComponent implements OnInit {
  private readonly importService = inject(ReceptionImportService);
  private readonly authentication = inject(AuthenticationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  selectedFile: File | null = null;
  report: DayImportReport | null = null;
  driveStatus: DayImportDriveStatus | null = null;

  state: 'selected' | 'validating' | 'valid' | 'invalid' | 'committing' | 'committed' | 'failed' | 'unknown' = 'selected';
  private selectionVersion = 0;
  private reviewedFile: File | null = null;

  downloading = false;
  dryRunning = false;
  committing = false;
  syncing = false;
  loadingDrive = false;
  downloadingReport = false;
  connectingDrive = false;
  disconnectingDrive = false;

  get canManageDrive(): boolean {
    return ['ADMIN', 'OOSMADMIN'].includes(String(this.authentication.currentUserValue?.role).toUpperCase());
  }

  ngOnInit(): void {
    this.handleOAuthReturn();
    this.refreshDriveStatus();
  }

  get validRows(): DayImportRow[] {
    return (this.report?.rows ?? []).filter((r) => r.status !== 'ERROR');
  }

  get invalidRows(): DayImportRow[] {
    return (this.report?.rows ?? []).filter((r) => r.status === 'ERROR');
  }

  onFileSelected(event: Event): void {
    if (this.committing || this.state === 'unknown') return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectionVersion++;
    this.selectedFile = file?.name.toLowerCase().endsWith('.xlsx') ? file : null;
    this.report = null;
    this.reviewedFile = null;
    this.dryRunning = false;
    this.state = 'selected';
    if (file && !this.selectedFile) this.fail('ABIOOC.DAY_IMPORT.XLSX_REQUIRED', () => {});
  }

  downloadTemplate(): void {
    this.downloading = true;
    this.importService.downloadTemplate().subscribe({
      next: (blob) => {
        saveAs(blob, 'oosm-day-import-template.xlsx');
        this.downloading = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_DOWNLOAD', () => (this.downloading = false))
    });
  }

  downloadSample(): void {
    this.downloading = true;
    this.importService.downloadSample().subscribe({
      next: (blob) => {
        saveAs(blob, 'oosm-day-import-sample.xlsx');
        this.downloading = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_DOWNLOAD', () => (this.downloading = false))
    });
  }

  runDryRun(): void {
    if (!this.selectedFile || this.dryRunning || this.committing || this.state === 'unknown') return;
    const file = this.selectedFile;
    const version = this.selectionVersion;
    this.report = null;
    this.reviewedFile = null;
    this.dryRunning = true;
    this.state = 'validating';
    this.importService.dryRun(file).subscribe({
      next: (report) => {
        if (version !== this.selectionVersion || file !== this.selectedFile) return;
        this.report = report;
        this.reviewedFile = file;
        this.dryRunning = false;
        this.state = report.canCommit && !!report.runId ? 'valid' : 'invalid';
      },
      error: (err) => {
        if (version !== this.selectionVersion) return;
        this.state = 'failed';
        this.fail('ABIOOC.DAY_IMPORT.ERROR_DRY_RUN', () => (this.dryRunning = false), err?.error?.message);
      }
    });
  }

  downloadReport(format: DayImportReportFormat): void {
    if (!this.report?.runId) {
      return;
    }
    this.downloadingReport = true;
    this.importService.savedReport(this.report.runId, format).subscribe({
      next: (blob) => {
        saveAs(blob, `oosm-day-import-report.${format}`);
        this.downloadingReport = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_REPORT', () => (this.downloadingReport = false))
    });
  }

  commit(): void {
    if (
      this.state !== 'valid' ||
      this.committing ||
      this.dryRunning ||
      !this.selectedFile ||
      this.reviewedFile !== this.selectedFile ||
      !this.report?.canCommit ||
      !this.report.runId
    )
      return;
    const runId = this.report.runId;
    this.committing = true;
    this.state = 'committing';
    this.importService.commit(this.selectedFile, runId).subscribe({
      next: (report) => this.applyCommitResult(report),
      error: (err) => {
        this.committing = false;
        if (err?.status === 0 || err?.status >= 500) {
          this.state = 'unknown';
          this.fail('ABIOOC.DAY_IMPORT.OUTCOME_UNKNOWN', () => {});
          this.checkOutcome();
          return;
        }
        if (err?.error?.data) this.report = err.error.data;
        this.state = 'failed';
        this.fail('ABIOOC.DAY_IMPORT.ERROR_COMMIT', () => {}, err?.error?.message || err?.message);
      }
    });
  }

  retryCommit(): void {
    if (this.state !== 'unknown' || !this.report?.runId || !this.selectedFile) return;
    this.state = 'valid';
    this.commit();
  }

  checkOutcome(): void {
    if (!this.report?.runId) return;
    this.importService.run(this.report.runId).subscribe({
      next: (report) => {
        if (report.outcome === 'COMMITTED' || report.outcome === 'REPLAYED') this.applyCommitResult(report);
        else if (report.outcome === 'REJECTED') {
          this.report = report;
          this.state = 'failed';
        }
        // PREVIEW may mean the server is still executing; do not assume failure.
      },
      error: () => {
        this.state = 'unknown';
      }
    });
  }

  private applyCommitResult(report: DayImportReport): void {
    this.report = report;
    this.committing = false;
    if (report.invalidCount === 0 && (report.outcome === 'COMMITTED' || report.outcome === 'REPLAYED')) {
      this.state = 'committed';
      this.snackBar.open(this.translate.instant('ABIOOC.DAY_IMPORT.COMMIT_OK'), undefined, { duration: 2500 });
    } else {
      this.state = 'failed';
      this.fail('ABIOOC.DAY_IMPORT.ERROR_COMMIT', () => {});
    }
  }

  refreshDriveStatus(): void {
    this.loadingDrive = true;
    this.importService.driveStatus().subscribe({
      next: (status) => {
        this.driveStatus = status;
        this.loadingDrive = false;
      },
      error: () => {
        this.driveStatus = null;
        this.loadingDrive = false;
      }
    });
  }

  connectDrive(): void {
    if (!this.canManageDrive) return;
    this.connectingDrive = true;
    this.importService.driveAuthorizeUrl().subscribe({
      next: (url) => {
        this.connectingDrive = false;
        window.location.href = url;
      },
      error: (err) => this.fail('ABIOOC.DAY_IMPORT.ERROR_DRIVE_CONNECT', () => (this.connectingDrive = false), err?.message)
    });
  }

  disconnectDrive(): void {
    if (!this.canManageDrive) return;
    this.disconnectingDrive = true;
    this.importService.driveDisconnect().subscribe({
      next: (status) => {
        this.driveStatus = status;
        this.disconnectingDrive = false;
        this.snackBar.open(this.translate.instant('ABIOOC.DAY_IMPORT.DRIVE_DISCONNECTED'), undefined, {
          duration: 2500
        });
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_DRIVE', () => (this.disconnectingDrive = false))
    });
  }

  syncDrive(): void {
    if (!this.canManageDrive || !this.driveStatus?.configured) return;
    this.syncing = true;
    this.importService.driveSync().subscribe({
      next: (status) => {
        this.driveStatus = status;
        this.syncing = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_DRIVE', () => (this.syncing = false))
    });
  }

  driveResultLabel(status: string): string {
    const code = status.split(' ')[0];
    const key = `ABIOOC.DAY_IMPORT.DRIVE_RESULTS.${code}`;
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }

  private handleOAuthReturn(): void {
    const params = this.route.snapshot.queryParamMap;
    const gdrive = params.get('gdrive');
    if (!gdrive) {
      return;
    }
    if (gdrive === 'connected') {
      const email = params.get('email');
      this.snackBar.open(this.translate.instant('ABIOOC.DAY_IMPORT.DRIVE_CONNECTED_OK', { email: email || '' }), undefined, {
        duration: 3500
      });
    } else {
      const message = params.get('message') || this.translate.instant('ABIOOC.DAY_IMPORT.ERROR_DRIVE_CONNECT');
      this.snackBar.open(message, undefined, { duration: 4500 });
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  private fail(messageKey: string, done: () => void, detail?: string): void {
    done();
    const msg = detail || this.translate.instant(messageKey);
    this.snackBar.open(msg, undefined, { duration: 4000 });
  }
}
