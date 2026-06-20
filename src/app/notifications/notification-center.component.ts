import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SharedModule } from '../shared/shared.module';
import { UserNotification } from '../shared/models/notification.model';
import { NotificationService } from '../shared/services/notification.service';
import { NotificationTextService } from '../shared/services/notification-text.service';
import { NotificationTextPipe } from '../shared/pipes/notification-text.pipe';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    TranslateModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    NotificationTextPipe
  ],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss'
})
export class NotificationCenterComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly notificationTextService = inject(NotificationTextService);

  readonly unreadCount = this.notificationService.unreadCount;

  items: UserNotification[] = [];
  selected: UserNotification | null = null;
  loading = false;
  unreadOnly = false;
  pageIndex = 0;
  pageSize = 15;
  totalItems = 0;

  ngOnInit(): void {
    this.loadPage();
  }

  onFilterChange(unreadOnly: boolean): void {
    this.unreadOnly = unreadOnly;
    this.pageIndex = 0;
    this.selected = null;
    this.loadPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.selected = null;
    this.loadPage();
  }

  selectNotification(notification: UserNotification): void {
    this.selected = notification;
  }

  markSelectedRead(): void {
    if (!this.selected || this.selected.read) {
      return;
    }
    this.notificationService.markRead(this.selected);
    this.patchLocalReadState(this.selected.id);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
    this.items = this.items.map((item) => ({ ...item, read: true }));
    if (this.selected) {
      this.selected = { ...this.selected, read: true };
    }
  }

  openRelatedRecord(notification: UserNotification): void {
    this.notificationService.openNotification(notification);
    this.patchLocalReadState(notification.id);
    if (this.selected?.id === notification.id) {
      this.selected = { ...this.selected, read: true };
    }
  }

  private loadPage(): void {
    this.loading = true;
    this.notificationService
      .loadPage(this.pageIndex, this.pageSize, this.unreadOnly)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.items = page.data ?? [];
          this.totalItems = page.total ?? 0;
          this.loading = false;
          if (this.selected && !this.items.some((item) => item.id === this.selected?.id)) {
            this.selected = null;
          }
        },
        error: () => {
          this.items = [];
          this.loading = false;
        }
      });
  }

  private patchLocalReadState(id: string): void {
    this.items = this.items.map((item) => (item.id === id ? { ...item, read: true } : item));
  }

  paginatorLength(): number {
    return this.totalItems;
  }
}
