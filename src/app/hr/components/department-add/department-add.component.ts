import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DepartmentService } from '../../services/departement-service';
import { ToastService } from '../../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {Department} from "../../model/department.model";

@Component({
  selector: 'app-department-add',
  standalone: true,
  templateUrl: './department-add.component.html',
  styleUrls: ['./department-add.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe,
    CardComponent
  ]
})
export class DepartmentAddComponent implements OnInit {
  departmentForm: FormGroup;
  isEditing = false;
  departmentId?: string;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.departmentForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.departmentId = id;
      this.loadDepartment(this.departmentId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      externalId: [''],
      managerId: [''],
    });
  }

  private loadDepartment(id: string): void {
    this.loading = true;
    this.departmentService.getDepartment(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const department = Array.isArray(response.data) ? response.data[0] : response.data;
          this.departmentForm.patchValue({
            name: department.name,
            description: department.description || '',
            externalId: department.externalId,
            managerId: department.managerId,
          });
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_LOADING'));
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.departmentForm.valid) {
      this.loading = true;
      const formValue = this.departmentForm.value;

      const departmentData: any = {
        id: this.departmentId,
        name: formValue.name,
        description: formValue.description || '',
        externalId: formValue.externalId,
        managerId: formValue.managerId,

      };

      if (this.isEditing && this.departmentId) {
        this.updateDepartment(departmentData);
      } else {
        this.addDepartment(departmentData);
      }
    }
  }

  private addDepartment(department: any): void {
    this.departmentService.addDepartment(department).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('DEPARTMENT.MESSAGES.SAVE_SUCCESS'));
          this.router.navigate(['/hr/department']);
        } else {
          this.toast.error(response.message || this.translate.instant('DEPARTMENT.MESSAGES.ERROR_SAVING'));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_SAVING'));
        this.loading = false;
      }
    });
  }

  private updateDepartment(department: any): void {
    this.departmentService.updateDepartment(department).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('DEPARTMENT.MESSAGES.UPDATE_SUCCESS'));
          this.router.navigate(['/hr/department']);
        } else {
          this.toast.error(response.message || this.translate.instant('DEPARTMENT.MESSAGES.ERROR_UPDATING'));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('DEPARTMENT.MESSAGES.ERROR_UPDATING'));
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/hr/department']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.departmentForm.get(controlName);
    if (control?.hasError('required')) {
      return this.translate.instant('COMMON.VALIDATION.REQUIRED');
    }
    return '';
  }
}
