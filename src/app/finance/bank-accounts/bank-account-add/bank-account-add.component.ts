import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
 import { BankAccountService } from '../../service/bankAccount.service';
import { BankAccount } from '../../models/BankAccount';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-bank-account-add',
  templateUrl: './bank-account-add.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    TranslateModule
  ],
  standalone: true,

  styleUrls: ['./bank-account-add.component.scss']
})
export class BankAccountAddComponent implements OnInit {
  bankAccountForm: FormGroup;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private bankAccountService: BankAccountService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
  }

  private initForm(): void {
    this.bankAccountForm = this.fb.group({
      rib: ['', [Validators.required, Validators.minLength(24), Validators.maxLength(24)]],
      iban: ['', [Validators.required, Validators.minLength(24), Validators.maxLength(24)]],
      bicSwift: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(11)]],
      bankName: ['', Validators.required],
      bankBranch: ['', Validators.required],
      currency: ['', Validators.required],
      accountType: ['', Validators.required],
      active: [true]
    });
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadBankAccountData(id);
    }
  }

  private loadBankAccountData(id: string): void {
    this.loading = true;
    this.bankAccountService.getBankAccount(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bankAccountForm.patchValue(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bank account:', error);
        this.toast.error('Error loading bank account details');
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.bankAccountForm.valid) {
      this.loading = true;
      const bankAccount: BankAccount = this.bankAccountForm.value;

      const request = this.isEditMode
        ? this.bankAccountService.updateBankAccount(bankAccount)
        : this.bankAccountService.createBankAccount(bankAccount);

      request.subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success(`Bank account ${this.isEditMode ? 'updated' : 'created'} successfully`);
            this.router.navigate(['/finance/banks']);
          } else {
            this.toast.error(response.message || 'Operation failed');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error saving bank account:', error);
          this.toast.error('Error saving bank account');
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.bankAccountForm);
    }
  }

  onBack(): void {
    this.router.navigate(['/finance/banks']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
