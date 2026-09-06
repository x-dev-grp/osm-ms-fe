import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { SharedModule } from '../../shared/shared.module';
import {
  DayImportDriveStatus,
  DayImportReport,
  DayImportReportFormat,
  DayImportRow,
  ReceptionImportService
} from './reception-import.service';
import { SupportTicketService } from '../../shared/services/support-ticket.service';

@Component({
  selector: 'app-reception-import-wizard',
  standalone: true,
  imports: [CommonModule, SharedModule, MatSnackBarModule],
  templateUrl: './reception-import-wizard.component.html',
  styleUrls: ['./reception-import-wizard.component.scss']
})
export class ReceptionImportWizardComponent implements OnInit {
  private readonly importService = inject(ReceptionImportService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supportTickets = inject(SupportTicketService);

  selectedFile: File | null = null;
  report: DayImportReport | null = null;
  driveStatus: DayImportDriveStatus | null = null;

  downloading = false;
  dryRunning = false;
  committing = false;
  syncing = false;
  loadingDrive = false;
  downloadingReport = false;
  connectingDrive = false;
  disconnectingDrive = false;

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
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.report = null;
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
    if (!this.selectedFile) {
      return;
    }
    this.dryRunning = true;
    this.importService.dryRun(this.selectedFile).subscribe({
      next: (report) => {
        this.report = report;
        this.dryRunning = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_DRY_RUN', () => (this.dryRunning = false))
    });
  }

  downloadReport(format: DayImportReportFormat): void {
    if (!this.selectedFile) {
      return;
    }
    this.downloadingReport = true;
    this.importService.dryRunReport(this.selectedFile, format).subscribe({
      next: (blob) => {
        saveAs(blob, `oosm-day-import-report.${format}`);
        this.downloadingReport = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_REPORT', () => (this.downloadingReport = false))
    });
  }

  commit(): void {
    if (!this.selectedFile || !this.report?.canCommit) {
      return;
    }
    this.committing = true;
    this.importService.commit(this.selectedFile).subscribe({
      next: (report) => {
        this.report = report;
        this.committing = false;
        this.snackBar.open(this.translate.instant('ABIOOC.DAY_IMPORT.COMMIT_OK'), undefined, { duration: 2500 });
      },
      error: (err) => {
        const message = err?.message || this.translate.instant('ABIOOC.DAY_IMPORT.ERROR_COMMIT');
        this.committing = false;
        this.snackBar.open(message, undefined, { duration: 6000 });
        // Backend also auto-opens a ticket; ensure one exists if API returned a plain HTTP error.
        if (!String(message).includes('Support ticket')) {
          this.supportTickets
            .create({
              subject: 'Day Excel import commit failed',
              description: `Automatic ticket from Reception → Day Excel import.\n\nFile: ${this.selectedFile?.name || '?'}\nError: ${message}`,
              priority: 'HIGH',
              pageUrl: '/reception/import'
            })
            .subscribe((ticket) => {
              if (ticket?.id) {
                this.snackBar.open(
                  this.translate.instant('ABIOOC.DAY_IMPORT.COMMIT_TICKET_CREATED', { id: ticket.id }),
                  undefined,
                  { duration: 4000 }
                );
              }
            });
        }
      }
    });
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
    this.connectingDrive = true;
    this.importService.driveAuthorizeUrl().subscribe({
      next: (url) => {
        this.connectingDrive = false;
        window.location.href = url;
      },
      error: (err) =>
        this.fail('ABIOOC.DAY_IMPORT.ERROR_DRIVE_CONNECT', () => (this.connectingDrive = false), err?.message)
    });
  }

  disconnectDrive(): void {
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
    this.syncing = true;
    this.importService.driveSync().subscribe({
      next: (status) => {
        this.driveStatus = status;
        this.syncing = false;
      },
      error: () => this.fail('ABIOOC.DAY_IMPORT.ERROR_DRIVE', () => (this.syncing = false))
    });
  }

  private handleOAuthReturn(): void {
    const params = this.route.snapshot.queryParamMap;
    const gdrive = params.get('gdrive');
    if (!gdrive) {
      return;
    }
    if (gdrive === 'connected') {
      const email = params.get('email');
      this.snackBar.open(
        this.translate.instant('ABIOOC.DAY_IMPORT.DRIVE_CONNECTED_OK', { email: email || '' }),
        undefined,
        { duration: 3500 }
      );
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
