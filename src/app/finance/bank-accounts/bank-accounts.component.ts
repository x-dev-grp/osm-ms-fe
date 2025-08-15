import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BankAccount } from '../models/BankAccount';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BankAccountService } from '../service/bankAccount.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { BANK_ACCOUNTS_DASHBOARD_CONFIG } from './bank-accounts-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  templateUrl: './bank-accounts.component.html',
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
    SharedModule,
    OsmDashboard
  ]
})
export class BankAccountsComponent implements OnInit {
  bankForm!: FormGroup;
  formOpen = false;
  isEditing = false;
  dashboardConfig: DashboardConfig = BANK_ACCOUNTS_DASHBOARD_CONFIG;

  currencies = ['TND', 'EUR', 'USD'];
  accountTypes = ['Courant', 'Épargne', 'Salaire'];

  banks: BankAccount[] = [];
  dataSource: MatTableDataSource<BankAccount> = new MatTableDataSource(this.banks);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private bankAccountService: BankAccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildBankForm();
  }

  private buildBankForm(): void {
    this.bankForm = this.fb.group({
      rib: ['', Validators.required],
      iban: ['', Validators.required],
      bicSwift: ['', Validators.required],
      bankName: ['', Validators.required],
      bankBranch: [''],
      currency: ['TND', Validators.required],
      accountType: ['Courant', Validators.required],
      active: [true]
    });
  }

  handleAction(event: { action: Action; row: BankAccount }): void {
    switch (event.action.value?.toUpperCase()) {
      case 'VIEW':
        this.router.navigate(['/finance/banks', event.row.id, 'view']);
        break;

      case 'EDIT':
        this.router.navigate(['/finance/banks', event.row.id, 'edit']);
        break;

      case 'DELETE':
        this.deleteAccount(event.row);
        break;
    }
  }

  private deleteAccount(account: BankAccount): void {
    if (confirm('Are you sure you want to delete this bank account?')) {
      this.bankAccountService.deleteBankAccount(account.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Bank account deleted successfully', 'Close', { duration: 3000 });
            // Refresh the list
            this.loadBanks();
          } else {
            this.snackBar.open(response.message || 'Failed to delete bank account', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting bank account:', error);
          this.snackBar.open('Error deleting bank account', 'Close', { duration: 3000 });
        }
      });
    }
  }

  private loadBanks(): void {
    this.bankAccountService.getAllBanksList().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.banks = response.data;
          this.dataSource.data = this.banks;
        }
      },
      error: (error) => {
        console.error('Error loading bank accounts:', error);
        this.snackBar.open('Error loading bank accounts', 'Close', { duration: 3000 });
      }
    });
  }
}
