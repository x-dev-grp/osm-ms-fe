import { Component, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatDialog } from '@angular/material/dialog';

import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';

import { adminUserDashboardConfig } from './admin-user-dashboard.config';

import { ToastService } from '../../shared/services/toast.service';

import { ConfirmationDialogService, ConfirmationType } from '../../shared/services/confirmation-dialog.service';

import { AdminUserDetailDialogComponent } from './admin-user-detail-dialog/admin-user-detail-dialog.component';

import { AdminUserService } from '../services/admin-user.service';

@Component({
  selector: 'app-admin-users',

  standalone: true,

  imports: [CommonModule, TranslateModule, OsmDashboard, RouterLink, MatButtonModule, MatIconModule],

  templateUrl: './admin-users.component.html',

  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent {
  readonly dashboardConfig = adminUserDashboardConfig;

  @ViewChild('dashboard') dashboard!: OsmDashboard;

  constructor(
    private adminUserService: AdminUserService,

    private toast: ToastService,

    private translate: TranslateService,

    private confirmationDialog: ConfirmationDialogService,

    private dialog: MatDialog
  ) {}

  applyAction(event: { row: Record<string, unknown>; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.openUserDetail(event.row);

        break;

      case 'RESET_PASSWORD':
        this.confirmResetPassword(event.row);

        break;
    }
  }

  private openUserDetail(user: Record<string, unknown>): void {
    this.dialog.open(AdminUserDetailDialogComponent, {
      width: '640px',

      maxWidth: '95vw',

      data: { user }
    });
  }

  private confirmResetPassword(user: Record<string, unknown>): void {
    const userId = user['id'] != null ? String(user['id']) : '';

    if (!userId) {
      this.toast.error(this.translate.instant('ADMIN_USERS.RESET_ERROR'));

      return;
    }

    if (!this.resolveResetIdentifier(user)) {
      this.toast.error(this.translate.instant('ADMIN_USERS.RESET_NO_CONTACT'));

      return;
    }

    const username = String(user['username'] ?? '');

    this.confirmationDialog

      .confirm({
        title: 'ADMIN_USERS.RESET_TITLE',

        message: 'ADMIN_USERS.RESET_MESSAGE',

        type: ConfirmationType.WARNING,

        confirmText: 'ADMIN_USERS.RESET_CONFIRM',

        cancelText: 'STANDARD.BTNS.CANCEL',

        showIcon: true,

        itemName: username,

        destructive: false
      })

      .subscribe((result) => {
        if (!result.confirmed) {
          return;
        }

        this.adminUserService.issueTemporaryPassword(userId).subscribe({
          next: () => {
            this.toast.success(this.translate.instant('ADMIN_USERS.RESET_SUCCESS'));
          },

          error: () => {
            this.toast.error(this.translate.instant('ADMIN_USERS.RESET_ERROR'));
          }
        });
      });
  }

  private resolveResetIdentifier(user: Record<string, unknown>): string | null {
    const email = String(user['email'] ?? '').trim();

    const phone = String(user['phoneNumber'] ?? '').trim();

    return email || phone || null;
  }
}
