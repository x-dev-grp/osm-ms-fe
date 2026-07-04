import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { SupportTicketService } from 'src/app/shared/services/support-ticket.service';
import { SupportTicket } from 'src/app/shared/models/support-ticket.model';
import { SupportTicketDetailDialogComponent } from 'src/app/shared/components/support-ticket-detail-dialog/support-ticket-detail-dialog.component';
import { SupportTicketDialogComponent } from 'src/app/shared/components/support-ticket-dialog/support-ticket-dialog.component';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TranslateModule
  ],
  templateUrl: './admin-support.component.html',
  styleUrls: ['./admin-support.component.scss']
})
export class AdminSupportComponent implements OnInit {
  private readonly supportTicketService = inject(SupportTicketService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = [
    'createdDate',
    'subject',
    'tenantName',
    'reporterDisplayName',
    'status',
    'priority',
    'actions'
  ];

  tickets: SupportTicket[] = [];
  loading = false;
  total = 0;
  pageIndex = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.loadTickets();
  }

  createTicket(): void {
    const dialogRef = this.dialog.open(SupportTicketDialogComponent, {
      width: '520px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadTickets());
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTickets();
  }

  viewTicket(ticket: SupportTicket): void {
    const dialogRef = this.dialog.open(SupportTicketDetailDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { ticket, canManage: true }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updated) => {
      if (updated) {
        this.loadTickets();
      }
    });
  }

  refresh(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.loading = true;
    this.supportTicketService
      .list(this.pageIndex, this.pageSize, 'all')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.tickets = response.data ?? [];
          this.total = response.total ?? 0;
          this.loading = false;
        },
        error: () => {
          this.tickets = [];
          this.total = 0;
          this.loading = false;
        }
      });
  }
}
