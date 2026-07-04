import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupportTicketService } from '../../services/support-ticket.service';
import { SupportTicketPriority } from '../../models/support-ticket.model';

export interface SupportTicketDialogData {
  pageUrl?: string;
}

@Component({
  selector: 'app-support-ticket-dialog',
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
  templateUrl: './support-ticket-dialog.component.html',
  styleUrls: ['./support-ticket-dialog.component.scss']
})
export class SupportTicketDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<SupportTicketDialogComponent>);
  private readonly supportTicketService = inject(SupportTicketService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  readonly data = inject<SupportTicketDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly priorities: SupportTicketPriority[] = ['LOW', 'NORMAL', 'HIGH'];
  submitting = false;
  errorMsg = '';

  readonly form = this.fb.group({
    subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    priority: ['NORMAL' as SupportTicketPriority, Validators.required]
  });

  cancel(): void {
    if (this.submitting) {
      return;
    }
    this.ref.close(null);
  }

  submit(): void {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.errorMsg = '';

    const { subject, description, priority } = this.form.getRawValue();
    this.supportTicketService
      .create({
        subject: String(subject ?? '').trim(),
        description: String(description ?? '').trim(),
        priority: priority as SupportTicketPriority,
        pageUrl: this.data?.pageUrl
      })
      .subscribe({
        next: (ticket) => {
          this.submitting = false;
          if (!ticket) {
            this.errorMsg = this.translate.instant('SUPPORT.ERRORS.CREATE_FAILED');
            return;
          }
          this.snackBar.open(this.translate.instant('SUPPORT.TICKET_CREATED'), undefined, { duration: 4000 });
          this.ref.close(ticket);
        },
        error: () => {
          this.submitting = false;
          this.errorMsg = this.translate.instant('SUPPORT.ERRORS.CREATE_FAILED');
        }
      });
  }
}
