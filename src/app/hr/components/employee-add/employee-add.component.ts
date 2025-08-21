import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee-service';
import { Employee, Gender, MaritalStatus } from '../../model/employee-model';
import { ToastService } from '../../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { format } from 'date-fns';

@Component({
  selector: 'app-employee-add',
  standalone: true,
  templateUrl: './employee-add.component.html',
  styleUrls: ['./employee-add.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe,
    CardComponent
  ]
})
export class EmployeeAddComponent implements OnInit {
  employeeForm: FormGroup;
  isEditing = false;
  employeeId?: string;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.employeeForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.employeeId = id;
      this.loadEmployee(this.employeeId);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      cin: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      hireDate: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: [''],
      maritalStatus: [''],
      address: [''],
      postalCode: [''],
      city: [''],
      country: [''],
      isActive: [true]
    });
  }

  private loadEmployee(id: string): void {
    this.loading = true;
    this.employeeService.getEmployee(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const employee = Array.isArray(response.data) ? response.data[0] : response.data;
          this.employeeForm.patchValue({
            firstName: employee.firstName,
            lastName: employee.lastName,
            cin: employee.cin,
            gender: employee.gender,
            birthDate: new Date(employee.birthDate), // Conversion pour MatDatepicker
            hireDate: new Date(employee.hireDate),
            email: employee.email,
            phone: employee.phone,
            maritalStatus: employee.maritalStatus,
            address: employee.address,
            postalCode: employee.postalCode,
            city: employee.city,
            country: employee.country,
            isActive: employee.isActive
          });
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_LOADING'));
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.loading = true;
      const formValue = this.employeeForm.value;

      const employeeData: Employee = {
        id: this.employeeId,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        cin: formValue.cin,
        gender: formValue.gender,
        birthDate: this.formatDate(formValue.birthDate),
        hireDate: this.formatDate(formValue.hireDate),
        email: formValue.email || '',
        phone: formValue.phone || '',
        maritalStatus: formValue.maritalStatus,
        address: formValue.address || '',
        postalCode: formValue.postalCode || '',
        city: formValue.city || '',
        country: formValue.country || '',
        isActive:formValue.isActive
      };

      console.log('Payload envoyé :', employeeData);

      if (this.isEditing && this.employeeId) {
        this.updateEmployee(employeeData);
      } else {
        this.addEmployee(employeeData);
      }
    }
  }

  private addEmployee(employee: Employee): void {
    this.employeeService.addEmployee(employee).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('EMPLOYEE.MESSAGES.SAVE_SUCCESS'));
          this.router.navigate(['/hr/employee']);
        } else {
          this.toast.error(response.message || this.translate.instant('EMPLOYEE.MESSAGES.ERROR_SAVING'));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_SAVING'));
        this.loading = false;
      }
    });
  }

  private updateEmployee(employee: Employee): void {
    this.employeeService.updateEmployee(employee).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('EMPLOYEE.MESSAGES.UPDATE_SUCCESS'));
          this.router.navigate(['/hr/employee']);
        } else {
          this.toast.error(response.message || this.translate.instant('EMPLOYEE.MESSAGES.ERROR_UPDATING'));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('EMPLOYEE.MESSAGES.ERROR_UPDATING'));
        this.loading = false;
      }
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    const d = new Date(date);
    return format(d, 'yyyy-MM-dd');
  }

  onCancel(): void {
    this.router.navigate(['/hr/employee']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.employeeForm.get(controlName);
    if (control?.hasError('required')) {
      return this.translate.instant('COMMON.VALIDATION.REQUIRED');
    }
    if (control?.hasError('email')) {
      return this.translate.instant('COMMON.VALIDATION.EMAIL');
    }
    return '';
  }
}
