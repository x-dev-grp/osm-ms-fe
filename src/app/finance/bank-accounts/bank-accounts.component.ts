import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BankAccount, BankAccountWithTransactions } from '../models/BankAccount';
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
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { BANK_ACCOUNTS_DASHBOARD_CONFIG } from './bank-accounts-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';

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

  banks: BankAccountWithTransactions[] = [];
  dataSource: MatTableDataSource<BankAccountWithTransactions> = new MatTableDataSource(this.banks);

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
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

  handleAction(event: { action: string; row: BankAccount }): void {
    switch (event.action?.toUpperCase()) {
      case 'VIEW':
      case 'READ':
        this.router.navigate(['/finance/banks', event.row.id, 'view']);
        break;

      case 'EDIT':
      case 'UPDATE':
        this.router.navigate(['/finance/banks', event.row.id, 'edit']);
        break;


      default:
        console.log('Unhandled action:', event.action, 'for row:', event.row);
        break;
    }
  }



  private loadBanks(): void {
    // Try to get banks with balances first, fallback to regular if not available
    this.bankAccountService.getAllBanksWithBalances().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.banks = response.data;
          this.dataSource.data = this.banks;
        }
      },
      error: (error) => {
        console.warn('Enhanced banks load failed, falling back to regular:', error);
        // Fallback to regular bank accounts
        this.bankAccountService.getAllBanksList().subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.banks = response.data;
              this.dataSource.data = this.banks;
            }
          },
          error: (error) => {
            console.error('Error loading bank accounts:', error);
            this.toast.error('AUTO.ERROR_LOADING_BANK_ACCOUNTS');
          }
        });
      }
    });
  }



 }
