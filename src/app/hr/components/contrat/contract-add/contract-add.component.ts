import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContractService } from '../../../services/contract-service';
import { Contract, ContractStatus, ContractType } from '../../../model/contract.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../../theme/components/card/card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { format } from 'date-fns';
import { PosteService } from '../../../services/poste-service';
import { Poste } from '../../../model/poste.model';
import { EmployeeService } from '../../../services/employee-service';

@Component({
  selector: 'app-contract-add',
  standalone: true,
  templateUrl: './contract-add.component.html',
  styleUrls: ['./contract-add.component.scss'],
  imports: [
    TranslateModule,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    TranslatePipe,
    CardComponent
  ]
})
export class ContractAddComponent implements OnInit {
  contractForm: FormGroup;
  isEditing = false;
  contractId?: string;
  employeeId?: string;
  loading = false;
  postes: Poste[];
  selectedPoste: Poste | undefined;
  contractTypes = Object.values(ContractType);
  contractStatuses = Object.values(ContractStatus);

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService,
    private posteService: PosteService,
    private employeeService: EmployeeService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.contractForm = this.createForm();
    // Subscribe to poste changes to update externalId
    this.contractForm.get('poste')?.valueChanges.subscribe((poste) => {
      if (poste && poste.externalId) {
        this.contractForm.get('externalId')?.setValue(poste.externalId);
      } else {
        this.contractForm.get('externalId')?.setValue('');
      }
    });
  }

  ngOnInit(): void {
    this.loadPostes();
    this.employeeId = this.route.snapshot.paramMap.get('employeeId') || undefined;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.contractId = id;
      this.loadContract(this.contractId);
    }
  }

  private loadPostes(): void {
    this.posteService.getAllPostes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Fix the type issue - use the same pattern as other components
          this.postes = Array.isArray(response.data) ? response.data[0] : response.data;
          console.info('  chargement postes:', this.postes);
        } else {
          this.postes = [];
        }
      },
      error: (error) => {
        console.error('Erreur chargement postes:', error);
        this.toast.error(this.translate.instant('POSTE.MESSAGES.ERROR_LOADING'));
        this.postes = [];
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      contractType: ['', Validators.required],
      contractStatus: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      poste: [null], // Initialize with null instead of empty string
      externalId: [''] // Initialize with empty string instead of this.contractId which may be undefined
    });
  }

  private loadContract(id: string): void {
    this.loading = true;
    this.contractService.getContract(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const contract = Array.isArray(response.data) ? response.data[0] : response.data;
          this.contractForm.patchValue({
            contractType: contract.contractType,
            contractStatus: contract.contractStatus,
            startDate: new Date(contract.startDate),
            endDate: new Date(contract.endDate),
            salary: contract.salary,
            poste: contract.poste!,
            externalId: contract.externalId
          });
        }
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('CONTRACT.MESSAGES.ERROR_LOADING'));
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.contractForm.valid) {
      this.loading = true;
      const formValue = this.contractForm.value;

      const contractData: Contract = {
        contractType: formValue.contractType,
        contractStatus: formValue.contractStatus,
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        salary: formValue.salary,
        poste: formValue.poste ? formValue.poste : null, // Fix: Handle poste correctly
        externalId: formValue.poste ? formValue.poste.externalId : null // Fix: Get externalId from selected poste
      };

      if (this.isEditing && this.contractId) {
        contractData.id = this.contractId;
        this.updateContract(contractData);
      } else {
        this.addContract(contractData);
      }
    }
  }

  onCancel(): void {
    if (this.employeeId) {
      this.router.navigate(['/hr/employee/fetch', this.employeeId]);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.contractForm.get(controlName);
    if (control?.hasError('required')) {
      return this.translate.instant('COMMON.VALIDATION.REQUIRED');
    }
    if (control?.hasError('min')) {
      return this.translate.instant('COMMON.VALIDATION.MIN_VALUE');
    }
    return '';
  }

  private addContract(contract: Contract): void {
    if (!this.employeeId) {
      this.toast.error(this.translate.instant('CONTRACT.MESSAGES.EMPLOYEE_REQUIRED'));
      this.loading = false;
      return;
    }

    this.contractService.addContractEmployee(this.employeeId, contract).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'AUTO.ENREGISTRES_AVEC_SUCCES');
        this.loading = false; // Fix: Reset loading state on success
        this.router.navigate(['/hr/employee/fetch', this.employeeId]);
      },
      error: (err) => {
        console.log(err);
        this.toast.error('AUTO.ERREUR_LORS_DE_L_ENREGISTREMENT');
        this.loading = false; // Fix: Reset loading state on error
      }
    });
  }

  private updateContract(contract: Contract): void {
    this.contractService.updateContract(contract).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success(this.translate.instant('CONTRACT.MESSAGES.UPDATE_SUCCESS'));
          this.router.navigate(['/hr/employee/fetch', this.employeeId]);
        } else {
          this.toast.error(response.message || this.translate.instant('CONTRACT.MESSAGES.ERROR_UPDATING'));
        }
        this.loading = false; // Move this outside the if statement to ensure it's always reset
      },
      error: () => {
        this.toast.error(this.translate.instant('CONTRACT.MESSAGES.ERROR_UPDATING'));
        this.loading = false; // Ensure loading is reset even on error
      }
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    const d = new Date(date);
    return format(d, 'yyyy-MM-dd');
  }
}
