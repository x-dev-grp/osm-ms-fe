import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { HrListMeta, resolveHrListMeta } from '../config/hr-list-registry';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LeaveRequestService } from '../services/leave-request.service';
import { PayrollPeriodService } from '../services/payroll-period.service';
import { ToastService } from '../../shared/services/toast.service';
import { DocumentGenerationService } from '../../shared/services/document-generation.service';
import { Action, HREntity } from '../../theme/types/permissions';
import { PayrollPeriodStatus } from '../models/hr.enums';

@Component({
  selector: 'app-hr-entity-list',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, OosmDashboard, TranslateModule, MatButtonModule, MatIconModule],
  templateUrl: './hr-entity-list.component.html',
  styleUrl: './hr-entity-list.component.scss'
})
export class HrEntityListComponent implements OnInit {
  @ViewChild(OosmDashboard) dashboard?: OosmDashboard;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leaveService = inject(LeaveRequestService);
  private readonly payrollPeriodService = inject(PayrollPeriodService);
  private readonly toast = inject(ToastService);
  private readonly documents = inject(DocumentGenerationService);

  meta?: HrListMeta;
  dashboardConfig?: DashboardConfig;

  ngOnInit(): void {
    const segment = this.route.snapshot.routeConfig?.path ?? '';
    this.meta = resolveHrListMeta(segment);
    this.dashboardConfig = this.meta?.dashboardConfig;
  }

  onRowAction(event: { row: { id?: string; status?: string }; action: string }): void {
    const id = event.row?.id;
    if (!id || !this.meta) {
      return;
    }

    switch (event.action?.toUpperCase()) {
      case 'READ':
        this.router.navigate([this.meta.basePath, id, 'view']);
        break;
      case 'UPDATE':
      case 'EDIT':
        this.router.navigate([this.meta.basePath, id, 'edit']);
        break;
      case 'APPROVE':
        this.approveLeave(id);
        break;
      case 'REJECT':
        this.rejectLeave(id);
        break;
      case 'CALCULATE':
        if (this.meta.entity === HREntity.PAYROLLPERIOD) {
          this.generatePayslips(id);
        }
        break;
      case 'VALIDATE':
      case 'PAY':
      case 'CLOSE':
        if (this.meta.entity === HREntity.PAYROLLPERIOD) {
          this.advancePayrollPeriod(id, event.action.toUpperCase() as Action);
        }
        break;
      case 'GEN_PDF':
        if (this.meta.entity === HREntity.PAYSLIP) {
          this.documents.downloadPayslipPdf(id);
        } else {
          this.router.navigate([this.meta.basePath, id, 'view']);
        }
        break;
      default:
        break;
    }
  }

  private approveLeave(id: string): void {
    this.leaveService.approveLeaveRequest(id).subscribe({
      next: (response) => {
        if (response?.success) {
          this.toast.success('HR.LEAVES.ACTIONS.APPROVE_SUCCESS');
          this.dashboard?.refrechData();
          return;
        }
        this.toast.error(response?.message || 'HR.LEAVES.ACTIONS.ACTION_ERROR');
      },
      error: () => this.toast.error('HR.LEAVES.ACTIONS.ACTION_ERROR')
    });
  }

  private rejectLeave(id: string): void {
    this.leaveService.rejectLeaveRequest(id).subscribe({
      next: (response) => {
        if (response?.success) {
          this.toast.success('HR.LEAVES.ACTIONS.REJECT_SUCCESS');
          this.dashboard?.refrechData();
          return;
        }
        this.toast.error(response?.message || 'HR.LEAVES.ACTIONS.ACTION_ERROR');
      },
      error: () => this.toast.error('HR.LEAVES.ACTIONS.ACTION_ERROR')
    });
  }

  private generatePayslips(id: string): void {
    this.payrollPeriodService.generatePayslips(id).subscribe({
      next: (response) => {
        if (response?.success) {
          this.toast.success('HR.PAYROLL.PROFILE.GENERATE_SUCCESS');
          this.router.navigate(['/hr/payroll-periods', id, 'view']);
          return;
        }
        this.toast.error(response?.message || 'HR.PAYROLL.PROFILE.GENERATE_ERROR');
      },
      error: () => this.toast.error('HR.PAYROLL.PROFILE.GENERATE_ERROR')
    });
  }

  private advancePayrollPeriod(id: string, action: Action): void {
    const target = this.resolvePayrollTarget(action);
    if (!target) {
      return;
    }
    this.payrollPeriodService.advanceStatus(id, target).subscribe({
      next: (response) => {
        if (response?.success) {
          this.toast.success('HR.PAYROLL.PROFILE.STATUS_SUCCESS');
          this.dashboard?.refrechData();
          return;
        }
        this.toast.error(response?.message || 'HR.PAYROLL.PROFILE.STATUS_ERROR');
      },
      error: () => this.toast.error('HR.PAYROLL.PROFILE.STATUS_ERROR')
    });
  }

  private resolvePayrollTarget(action: Action): PayrollPeriodStatus | null {
    switch (action) {
      case Action.VALIDATE:
        return 'VALIDATED';
      case Action.PAY:
        return 'PAID';
      case Action.CLOSE:
        return 'CLOSED';
      default:
        return null;
    }
  }
}
