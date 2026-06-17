import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentService } from '../../../services/departement-service';
import { Department } from '../../../model/department.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslatePipe, TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardComponent } from '../../../../theme/components/card/card.component';
import { Employee } from "../../../model/employee-model";
import { EmployeeService } from "../../../services/employee-service";

@Component({
  selector: 'app-department-detail',
  standalone: true,
  templateUrl: './department-detail.component.html',
  styleUrls: ['./department-detail.component.scss'],
  imports: [TranslateModule, 
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
    CardComponent,
  ]
})
export class DepartmentDetailComponent implements OnInit {
  department: Department | null = null;
  loading = false;
  manager: Employee | null = null;
  loadingManager = false;
  employees: Employee[] = [];

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private departmentService: DepartmentService,
    private toast: ToastService,
    private employeeService: EmployeeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDepartment(id);
    }
  }

  private loadDepartment(id: string): void {
    this.loading = true;
    this.departmentService.getDepartment(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.department = Array.isArray(response.data) ? response.data[0] : response.data;

          // Charger les employés du département
          if (this.department.employees) {
            this.employees = Array.isArray(this.department.employees) ?
              this.department.employees :
              [this.department.employees];
          }

          // Charger les informations du manager si un managerId existe
          if (this.department.managerId) {
            this.loadManager(this.department.managerId);
          }
        } else {
          this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_LOADING'));
          this.router.navigate(['/hr/department']);
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_LOADING'));
        this.loading = false;
        this.router.navigate(['/hr/department']);
      }
    });
  }

  private loadManager(managerId: string): void {
    this.loadingManager = true;
    this.employeeService.getEmployee(managerId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.manager = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_LOADING_MANAGER'));
          this.manager = null;
        }
        this.loadingManager = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_LOADING_MANAGER'));
        this.loadingManager = false;
        this.manager = null;
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
