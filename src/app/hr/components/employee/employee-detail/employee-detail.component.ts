import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { EmployeeService } from '../../../services/employee-service';
import { ContractService } from '../../../services/contract-service';
import { Employee, Gender, MaritalStatus } from '../../../model/employee-model';
import { Contract } from '../../../model/contract.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslatePipe, TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/component/confirm-dialog/confirm-dialog.component';
import { CardComponent } from "../../../../theme/components/card/card.component";


@Component({
  selector: 'app-employee-detail',
  standalone: true,
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss'],
  imports: [TranslateModule, 
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    CardComponent,
    RouterLink
  ]
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  contracts: Contract[]=[];
  loading = false;
  contractsLoading = false;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private employeeService: EmployeeService,
    private contractService: ContractService,
    private toast: ToastService,
    private translate: TranslateService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
    }
  }

  private loadEmployee(id: string): void {
    this.loading = true;
    this.contractsLoading = true; // Ajouter ceci pour le chargement des contrats
    this.employeeService.getEmployee(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.employee = Array.isArray(response.data) ? response.data[0] : response.data;
          if (this.employee.contrats) {
            this.contracts = this.employee.contrats;
          }
        } else {
          this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_LOADING'));
          this.router.navigate(['/hr/employee']);
        }
        this.loading = false;
        this.contractsLoading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_LOADING'));
        this.loading = false;
        this.contractsLoading = false;
        this.router.navigate(['/hr/employee']);
      }
    });
  }
  deleteContract(contractId: string): void {
    if (!this.employee?.id) {
      this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.NOT_FOUND'));
      return;
    }

    if (confirm(this.translate.instant('CONTRACT.MESSAGES.CONFIRM_DELETE'))) {
      this.loading = true;
      this.contractService.deleteEmployeeContract(this.employee?.id, contractId).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success(this.translate.instant('CONTRACT.MESSAGES.DELETE_SUCCESS'));
            this.contracts = this.contracts.filter(c => c.id !== contractId); // ✅ Supprimer de la liste sans recharger toute la page
          } else {
            this.toast.error(response.message || this.translate.instant('CONTRACT.MESSAGES.ERROR_DELETING'));
          }
          this.loading = false;
        },
        error: () => {
          this.toast.error(this.translate.instant('CONTRACT.MESSAGES.ERROR_DELETING'));
          this.loading = false;
        }
      });
    }
  }






  getGenderText(gender: Gender): string {
    return this.translate.instant(`EMPLOYEE.GENDER.${gender}`);
  }

  getMaritalStatusText(status: MaritalStatus): string {
    return this.translate.instant(`EMPLOYEE.MARITAL_STATUS.${status}`);
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
