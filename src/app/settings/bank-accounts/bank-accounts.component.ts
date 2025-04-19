import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BankAccount } from '../../shared/models/BankAccount';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { SharedModule } from '../../demo/shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BankAccountService } from '../../shared/services/bankAccount.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';

@Component({
  selector: 'app-bank-account', // <-- plural
  standalone: true,
  templateUrl: './bank-accounts.component.html', // <-- plural
  styleUrls: ['./bank-accounts.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    SharedModule
  ]
})
export class BankAccountsComponent implements OnInit {
  bankForm!: FormGroup;
  formOpen = false;
  isEditing = false;

  displayedColumns = ['rib', 'iban', 'bicSwift', 'bankName', 'bankBranch', 'currency', 'accountType',  'active', 'actions'];

  currencies = ['TND', 'EUR', 'USD'];
  accountTypes = ['Current', 'Savings', 'Payroll'];

  private editIndex: number | null = null;
  banks: BankAccount[] = [];
  dataSource: MatTableDataSource<BankAccount> = new MatTableDataSource(this.banks);
  private profile: CompanyProfile;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private bankAccountService: BankAccountService

  ) {}

  ngOnInit(): void {
    this.buildBankForm();
    this.loadBankAccounts();

  }

  private buildBankForm(): void {
    this.bankForm = this.fb.group({
      rib: ['', Validators.required],
      iban: ['', Validators.required],
      bicSwift: ['', Validators.required],
      bankName: ['', Validators.required],
      bankBranch: [''],
      currency: ['TND', Validators.required],
      accountType: ['Current', Validators.required],
      active: [true]
    });
  }

  openForm(account?: BankAccount): void {
    if (account) {
      this.isEditing = true;
      this.editIndex = this.dataSource.data.indexOf(account);
      this.bankForm.patchValue(account);
    } else {
      this.isEditing = false;
      this.editIndex = null;
      this.bankForm.reset({
        currency: 'TND',
        accountType: 'Current',
        active: true
      });
    }
    this.formOpen = true;
  }

  loadBankAccounts(): void {
    this.bankAccountService.getAllBanksList().subscribe(
      (res) => {
        if (res && res.success) {
          this.banks = res.data;
          this.dataSource.data = this.banks;
        } else {
          this.banks = [];
        }
      },
      (err) => console.error('Error loading deliveries', err)
    );
  }

  cancel(): void {
    this.formOpen = false;
    this.isEditing = false;
    this.editIndex = null;
    this.bankForm.reset({
      currency: 'TND',
      accountType: 'Current',
      active: true
    });
  }

  onSubmit(): void {
    if (this.bankForm.invalid) {
      this.bankForm.markAllAsTouched();
      return;
    }
    const acct = this.bankForm.value as BankAccount;
    const op$ = this.isEditing ? this.bankAccountService.updateBankAccount(acct) : this.bankAccountService.createBankAccount(acct);
    op$.subscribe(() => {
      this.snackBar.open(this.isEditing ? 'Bank account updated' : 'Bank account created', 'Close', { duration: 3000 });
      this.loadBankAccounts();
      this.cancel();
    });
  }

  deleteAccount(acc: BankAccount): void {
    if (!acc.id) return;
    this.bankAccountService.deleteBankAccount(acc.id).subscribe(() => {
      this.snackBar.open('Bank account deleted', 'Close', { duration: 3000 });
      this.loadBankAccounts();
    });
  }
}
