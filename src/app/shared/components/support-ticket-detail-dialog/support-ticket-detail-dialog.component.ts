import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupportTicketService } from '../../services/support-ticket.service';
import {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus
} from '../../models/support-ticket.model';

export interface SupportTicketDetailDialogData {
  ticket: SupportTicket;
  canManage: boolean;
}

@Component({
  selector: 'app-support-ticket-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './support-ticket-detail-dialog.component.html',
  styleUrls: ['./support-ticket-detail-dialog.component.scss']
})
export class SupportTicketDetailDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<SupportTicketDetailDialogComponent>);
  private readonly supportTicketService = inject(SupportTicketService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  readonly data = inject<SupportTicketDetailDialogData>(MAT_DIALOG_DATA);

  readonly statuses: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  readonly priorities: SupportTicketPriority[] = ['LOW', 'NORMAL', 'HIGH'];

  submitting = false;
  errorMsg = '';

  readonly form = this.fb.group({
    status: ['OPEN' as SupportTicketStatus],
    priority: ['NORMAL' as SupportTicketPriority],
    adminNote: ['']
  });

  ngOnInit(): void {
    this.form.patchValue({
      status: this.data.ticket.status,
      priority: this.data.ticket.priority,
      adminNote: this.data.ticket.adminNote ?? ''
    });

    if (!this.data.canManage) {
      this.form.disable();
    }
  }

  close(): void {
    this.ref.close(null);
  }

  save(): void {
    if (!this.data.canManage || this.submitting) {
      return;
    }

    this.submitting = true;
    this.errorMsg = '';

    const { status, priority, adminNote } = this.form.getRawValue();
    this.supportTicketService
      .update(this.data.ticket.id, {
        status: status as SupportTicketStatus,
        priority: priority as SupportTicketPriority,
        adminNote: String(adminNote ?? '')
      })
      .subscribe({
        next: (ticket) => {
          this.submitting = false;
          if (!ticket) {
            this.errorMsg = this.translate.instant('SUPPORT.ERRORS.UPDATE_FAILED');
            return;
          }
          this.snackBar.open(this.translate.instant('SUPPORT.TICKET_UPDATED'), undefined, { duration: 3000 });
          this.ref.close(ticket);
        },
        error: () => {
          this.submitting = false;
          this.errorMsg = this.translate.instant('SUPPORT.ERRORS.UPDATE_FAILED');
        }
      });
  }
}
