import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../shared/services/toast.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { resolveBillConditions, resolveBillDesignation } from '../utils/bill-labels.util';
import { FinancialTransaction } from '../models/financial-transaction.model';
import { FinancialTransactionService } from '../service/financial-transaction.service';
import { TRANSACTIONS_DASHBOARD_CONFIG } from './transactions-dashboard.config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { SharedModule } from '../../shared/shared.module';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { TUNISIA_VAT_STANDARD_RATE } from '../../shared/constants/tunisia-vat.constants';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, SharedModule, OsmDashboard],
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private readonly i18n = inject(TranslateService);
  dashboardConfig: DashboardConfig = TRANSACTIONS_DASHBOARD_CONFIG;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private transactionService: FinancialTransactionService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private dialog: MatDialog,
    private companyProfileService: CompanyProfileService
  ) {}

  ngOnInit(): void {
    this.dashboardConfig = this.buildDashboardConfigFromQueryParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Gère les actions depuis le tableau */
  handleAction(event: { row: FinancialTransaction; action: string }): void {
    const actionLabel = event.action?.toUpperCase();

    switch (actionLabel) {
      case 'READ':
        this.router.navigate(['/finance/transactions', event.row.id, 'view']);
        break;

      case 'PRINT':
        this.print(event.row.id!);
        break;

      case 'PRINT_BILL':
        this.printBill(event.row);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/transactions', event.row.id, 'edit']);
        break;

      case 'APPROVE':
        this.approve(event.row.id!);
        break;

      case 'REJECT':
        this.reject(event.row.id!);
        break;

      case 'DUPLICATE':
        this.duplicate(event.row.id!);
        break;
    }
  }

  /** Refresh dashboard data */

  /** Ouvre dans un nouvel onglet la vue et imprime */
  print(id: string): void {
    const tree = this.router.createUrlTree(['/finance/transactions', id, 'view'], { queryParams: { print: true } });
    const url = window.location.origin + this.router.serializeUrl(tree);
    window.open(url, '_blank');
  }

  printBill(transaction: FinancialTransaction): void {
    if (!transaction.id) {
      this.showError('TRANSACTIONS.MESSAGES.BILL_ERROR');
      return;
    }

    const profile = this.companyProfileService.getProfileFromCache();
    if (!profile) {
      this.showError('TRANSACTIONS.MESSAGES.COMPANY_PROFILE_REQUIRED');
      return;
    }

    this.loading = true;
    this.transactionService
      .generateTransactionBillPdf(transaction.id, this.buildBillRequest(transaction, profile))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.downloadPdf(response.body, this.extractPdfFileName(response.headers.get('content-disposition'), transaction));
          this.showSuccess('TRANSACTIONS.MESSAGES.BILL_SUCCESS');
          this.loading = false;
        },
        error: (error) => {
          this.showBillError(error);
          this.loading = false;
        }
      });
  }

  /** Approuve une transaction */
  approve(id: string): void {
    if (!confirm(this.i18n.instant('AUTO.ETES_VOUS_SUR_DE_VOULOIR_APPROUVER_CETTE_TRANSACTION'))) {
      return;
    }

    this.loading = true;

    this.transactionService
      .approveTransaction(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('TRANSACTIONS.MESSAGES.APPROVE_SUCCESS');
          } else {
            this.showError(response.message || 'TRANSACTIONS.MESSAGES.APPROVE_ERROR');
          }
          this.loading = false;
        },
        error: () => {
          this.showError('TRANSACTIONS.MESSAGES.APPROVE_ERROR');
          this.loading = false;
        }
      });
  }

  /** Rejette une transaction */
  reject(id: string): void {
    const reason = prompt(this.i18n.instant('AUTO.VEUILLEZ_INDIQUER_LA_RAISON_DU_REJET'));
    if (!reason) {
      return;
    }

    if (!confirm(this.i18n.instant('AUTO.ETES_VOUS_SUR_DE_VOULOIR_REJETER_CETTE_TRANSACTION'))) {
      return;
    }

    this.loading = true;

    this.transactionService
      .rejectTransaction(id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('TRANSACTIONS.MESSAGES.REJECT_SUCCESS');
          } else {
            this.showError(response.message || 'TRANSACTIONS.MESSAGES.REJECT_ERROR');
          }
          this.loading = false;
        },
        error: () => {
          this.showError('TRANSACTIONS.MESSAGES.REJECT_ERROR');
          this.loading = false;
        }
      });
  }

  /** Duplicate a transaction */
  duplicate(id: string): void {
    if (!confirm(this.i18n.instant('AUTO.VOULEZ_VOUS_DUPLIQUER_CETTE_TRANSACTION'))) {
      return;
    }

    this.loading = true;
    this.transactionService
      .getTransactionById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const transaction = response.data;
            // Navigate to add form with pre-filled data
            this.router.navigate(['/finance/transactions/new'], {
              queryParams: {
                duplicate: 'true',
                transactionType: transaction.transactionType,
                direction: transaction.direction,
                amount: transaction.amount,
                currency: transaction.currency,
                paymentMethod: transaction.paymentMethod,
                description: transaction.description,
                lotNumber: transaction.lotNumber
              }
            });
          }
          this.loading = false;
        },
        error: () => {
          this.showError('TRANSACTIONS.MESSAGES.LOAD_ERROR');
          this.loading = false;
        }
      });
  }

  /** Export single transaction */

  /** Bulk operations */
  bulkApprove(ids: string[]): void {
    if (!confirm(`Êtes-vous sûr de vouloir approuver ${ids.length} transaction(s) ?`)) {
      return;
    }

    this.loading = true;
    let completed = 0;
    let errors = 0;

    ids.forEach((id) => {
      this.transactionService
        .approveTransaction(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            completed++;
            if (!response.success) {
              errors++;
            }

            if (completed === ids.length) {
              if (errors === 0) {
                this.showSuccess(`${ids.length} transaction(s) approuvée(s) avec succès`);
              } else {
                this.showError(`${errors} transaction(s) n'ont pas pu être approuvées`);
              }

              this.loading = false;
            }
          },
          error: () => {
            completed++;
            errors++;
            if (completed === ids.length) {
              this.showError(`${errors} transaction(s) n'ont pas pu être approuvées`);

              this.loading = false;
            }
          }
        });
    });
  }

  private showSuccess(message: string): void {
    this.toast.success(message);
  }

  private showError(message: string): void {
    this.toast.error(message);
  }

  private showBillError(error: unknown): void {
    this.extractErrorMessage(error).then((message) => this.toast.error(message || 'TRANSACTIONS.MESSAGES.BILL_ERROR'));
  }

  private async extractErrorMessage(error: unknown): Promise<string | null> {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }
    if (error.error instanceof Blob) {
      const text = await error.error.text();
      try {
        const parsed = JSON.parse(text);
        return parsed.message || text;
      } catch {
        return text || null;
      }
    }
    return error.error?.message || error.message || null;
  }

  private buildBillRequest(transaction: FinancialTransaction, profile: CompanyProfile) {
    return {
      title: 'Facture commerciale',
      issuer: this.toIssuerParty(profile),
      logoBase64: profile.logoData,
      logoContentType: profile.logoContentType,
      designation: resolveBillDesignation(this.i18n, transaction),
      conditions: resolveBillConditions(this.i18n, transaction),
      vatRatePercent: TUNISIA_VAT_STANDARD_RATE,
      footerContact: {
        companyName: profile.legalName,
        phone: profile.phone
      },
      notes: transaction.lotNumber ? `Lot: ${transaction.lotNumber}` : undefined
    };
  }

  private toIssuerParty(profile: CompanyProfile) {
    const address = [profile.addressLine1, profile.postalCode, profile.city, profile.governorate].filter(Boolean).join(', ');
    return {
      displayName: profile.legalName,
      taxRegistrationNumber: profile.taxId,
      address: address || 'N/A',
      phone: profile.phone,
      email: profile.email,
      website: profile.website || profile.email
    };
  }

  private downloadPdf(blob: Blob | null, fileName: string): void {
    if (!blob) {
      this.showError('TRANSACTIONS.MESSAGES.BILL_ERROR');
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private extractPdfFileName(contentDisposition: string | null, transaction: FinancialTransaction): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) {
      return match[1];
    }
    return `facture-${transaction.invoiceReference || transaction.id || 'transaction'}.pdf`;
  }

  private buildDashboardConfigFromQueryParams(): DashboardConfig {
    const lotNumber = this.route.snapshot.queryParamMap.get('lotNumber');
    if (!lotNumber) {
      return TRANSACTIONS_DASHBOARD_CONFIG;
    }

    const config = JSON.parse(JSON.stringify(TRANSACTIONS_DASHBOARD_CONFIG)) as DashboardConfig;
    config.defaultSearchData = {
      ...config.defaultSearchData,
      page: 0,
      searchData: {
        operation: SearchOperation.AND,
        searchs: [],
        search: {
          ...(config.defaultSearchData?.searchData?.search ?? {}),
          lotNumber: { equalValue: lotNumber }
        }
      }
    };
    return config;
  }
}
