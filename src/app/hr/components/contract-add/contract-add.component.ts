import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContractService } from '../../services/contract-service';
import { Contract, ContractStatus, ContractType } from '../../model/contract.model';
import { ToastService } from '../../../shared/services/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { format } from 'date-fns';
import { PosteService } from '../../services/poste-service';
import { Poste } from '../../model/poste.model';
import { EmployeeService } from '../../services/employee-service';
import {catchError} from "rxjs/operators";
import {of} from "rxjs";

@Component({
  selector: 'app-contract-add',
  standalone: true,
  templateUrl: './contract-add.component.html',
  styleUrls: ['./contract-add.component.scss'],
  imports: [
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
  postes: Poste[] = [];
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
          if (Array.isArray(response.data) && response.data.length > 0) {
            if (Array.isArray(response.data[0])) {
              this.postes = (response.data as Poste[][]).flat();
            } else {
              this.postes = response.data as unknown as Poste[];
            }
          } else {
            this.postes = [];
          }
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
      posteId: [''],
      externalId: [this.contractId]
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
            posteId: contract.poste?.id || '',
            externalId: contract.externalId,
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
      const selectedPoste = this.postes.find(poste =>
        String(poste.id) === String(formValue.posteId)
      );

      const contractData: Contract = {
        contractType: formValue.contractType,
        contractStatus: formValue.contractStatus,
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        salary: formValue.salary,
        poste: selectedPoste ? { id: selectedPoste.id } as any : undefined,
        employee: { id: this.employeeId } as any ,
        externalId:formValue.externalId,
      };

      if (this.isEditing && this.contractId) {
        contractData.id = this.contractId;
        this.updateContract(contractData);
      } else {
        this.addContract(contractData);
      }
    }
  }

  private addContract(contract: Contract): void {
    if (!this.employeeId) {
      this.toast.error(this.translate.instant('CONTRACT.MESSAGES.EMPLOYEE_REQUIRED'));
      this.loading = false;
      return;
    }


    this.contractService.addContractEmployee(this.employeeId, contract).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || ' enregistrés avec succès.' );
        this.router.navigate(['/hr/employee/fetch', this.employeeId]);
        },
      error: (err) => {
        console.log(err);
        this.toast.error('Erreur lors de l\'enregistrement ' );
       }
    });
    return;
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
        this.loading = false;
      },
      error: () => {
        this.toast.error(this.translate.instant('CONTRACT.MESSAGES.ERROR_UPDATING'));
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
}
