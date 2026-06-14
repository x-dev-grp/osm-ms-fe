import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface AdminUserDetailDialogData {
  user: Record<string, unknown>;
}

@Component({
  selector: 'app-admin-user-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './admin-user-detail-dialog.component.html',
  styleUrl: './admin-user-detail-dialog.component.scss'
})
export class AdminUserDetailDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<AdminUserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdminUserDetailDialogData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  get roleName(): string {
    const role = this.data.user['role'];
    if (role && typeof role === 'object' && role !== null && 'roleName' in role) {
      return this.displayValue((role as Record<string, unknown>)['roleName']);
    }
    return '-';
  }

  get tenantName(): string {
    const name = this.data.user['tenantName'];
    if (name != null && String(name).trim()) {
      return String(name).trim();
    }
    return '-';
  }

  get isLocked(): boolean {
    return Boolean(this.data.user['isLocked']);
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }
}
