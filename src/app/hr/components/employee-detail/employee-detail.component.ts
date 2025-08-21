import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee-service';
import { Employee, Gender, MaritalStatus } from '../../model/employee-model';
import { ToastService } from '../../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {CardComponent} from "../../../theme/components/card/card.component";

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    CardComponent
  ]
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private employeeService: EmployeeService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
    }
  }

  private loadEmployee(id: string): void {
    this.loading = true;
    this.employeeService.getEmployee(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.employee = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_LOADING'));
          this.router.navigate(['/hr/employee']);
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_LOADING'));
        this.loading = false;
        this.router.navigate(['/hr/employee']);
      }
    });
  }

  getGenderText(gender: Gender): string {
    return this.translate.instant(`EMPLOYEE.GENDER.${gender}`);
  }

  getMaritalStatusText(status: MaritalStatus): string {
    return this.translate.instant(`EMPLOYEE.MARITAL_STATUS.${status}`);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
