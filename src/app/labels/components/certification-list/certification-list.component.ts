import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardConfig } from '../../../shared/modules/oosm-dashboard/models/dashboard-config';
import { OosmDashboard } from '../../../shared/modules/oosm-dashboard/oosm-dashboard';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';
import { CertificationFormComponent } from '../certification-form/certification-form.component';
import { CERTIFICATION_DASHBOARD_CONFIG } from './certification-dashboard.config';

@Component({
  selector: 'app-certification-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatDialogModule, OosmDashboard],
  templateUrl: './certification-list.component.html',
  styleUrls: ['./certification-list.component.scss']
})
export class CertificationListComponent {
  dashboardConfig: DashboardConfig = CERTIFICATION_DASHBOARD_CONFIG;

  @ViewChild('dashboard') dashboard!: OosmDashboard;

  constructor(
    private certService: CertificationService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  handleAction(event: { row: Certification; action: string }): void {
    const actionLabel = event.action?.toUpperCase();

    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/labels/certifications', event.row.id]);
        break;
      case 'UPDATE':
        this.openForm(event.row);
        break;
      case 'REMOVE':
        this.deleteCert(event.row);
        break;
    }
  }

  openForm(cert?: Certification): void {
    const dialogRef = this.dialog.open(CertificationFormComponent, {
      width: '600px',
      data: cert || {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.id) {
          this.certService.update(result).subscribe(() => this.refreshDashboard());
        } else {
          this.certService.create(result).subscribe(() => this.refreshDashboard());
        }
      }
    });
  }

  deleteCert(cert: Certification): void {
    if (confirm(`Etes-vous sur de vouloir supprimer la certification "${cert.name}" ?`)) {
      this.certService.delete(cert.id!).subscribe(() => this.refreshDashboard());
    }
  }

  private refreshDashboard(): void {
    this.dashboard?.refrechData();
  }
}
