import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';
import { FinancialTransaction, parseTransactionAmount, TransactionBillRequest, TransactionDirection } from '../../models/financial-transaction.model';
import { FinancialTransactionService } from '../../service/financial-transaction.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';
import { TUNISIA_VAT_STANDARD_RATE } from '../../../shared/constants/tunisia-vat.constants';
import { HttpErrorResponse } from '@angular/common/http';
import { resolveBillConditions, resolveBillDesignation } from '../../utils/bill-labels.util';
import { isPurchaseBillTransaction } from '../../utils/bill-vat.util';
import { FinanceResourceLink, resolveFinanceResourceLinks } from '../../utils/finance-resource-links.util';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { openQrDialog } from '../../../shared/utils/open-qr-dialog.util';
import { ConfirmationDialogService, ConfirmationType } from '../../../shared/services/confirmation-dialog.service';
import { take } from 'rxjs';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { OOSMModule, FinanceEntity } from '../../../theme/types/permissions';
import { canRegenerateQr } from '../../../shared/utils/qr-permission.util';

@Component({
  selector: 'app-transaction-view',
  templateUrl: './transaction-view.component.html',
  standalone: true,
  imports: [
    MatDialogModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CardComponent,
    RouterLink,
        MatTooltipModule
  ],
  styleUrls: ['./transaction-view.component.scss']
})
export class TransactionViewComponent implements OnInit {
  readonly TransactionDirection = TransactionDirection;

  transaction?: FinancialTransaction;
  loading = true;
  error = false;
  isPrintMode = false;
  generatingQr = false;

  constructor(
    private auth: AuthenticationService,
    
    private dialog: MatDialog,
    
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: FinancialTransactionService,
    private toast: ToastService,
    private companyProfileService: CompanyProfileService,
    private translate: TranslateService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    this.isPrintMode = this.route.snapshot.queryParamMap.get('print') === 'true';

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransaction(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  private loadTransaction(id: string): void {
    this.loading = true;
    this.error = false;

    this.transactionService.getTransactionById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transaction = response.data;
        } else {
          this.error = true;
          this.showError('TRANSACTIONS.ERRORS.NOT_FOUND');
        }
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.showError('TRANSACTIONS.ERRORS.LOAD_ERROR');
      }
    });
  }

  onEdit(): void {
    if (this.transaction?.id) {
      this.router.navigate(['/finance/transactions', this.transaction.id, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/finance/transactions']);
  }

  onPrint(): void {
    window.print();
  }

  onPrintBill(): void {
    if (!this.transaction?.id) {
      this.showError('TRANSACTIONS.MESSAGES.BILL_ERROR');
      return;
    }

    const profile = this.companyProfileService.getProfileFromCache();
    if (!profile) {
      this.showError('TRANSACTIONS.MESSAGES.COMPANY_PROFILE_REQUIRED');
      return;
    }

    this.transactionService.generateTransactionBillPdf(this.transaction.id, this.buildBillRequest(profile)).subscribe({
      next: (response) => {
        this.downloadPdf(response.body, this.extractPdfFileName(response.headers.get('content-disposition')));
        this.toast.success('TRANSACTIONS.MESSAGES.BILL_SUCCESS');
      },
      error: (error) => this.showBillError(error)
    });
  }

  onDuplicate(): void {
    if (!this.transaction?.id) {
      return;
    }

    this.router.navigate(['/finance/transactions/new'], {
      queryParams: {
        duplicate: 'true',
        transactionType: this.transaction.transactionType,
        direction: this.transaction.direction,
        amount: this.amountValue,
        currency: this.transaction.currency,
        paymentMethod: this.transaction.paymentMethod,
        description: this.transaction.description,
        lotNumber: this.transaction.lotNumber
      }
    });
  }

  get amountValue(): number {
    return parseTransactionAmount(this.transaction?.amount);
  }

  getStatusClass(): string {
    if (!this.transaction) {
      return '';
    }
    return this.transaction.approved ? 'status-approved' : 'status-pending';
  }

  getStatusLabel(): string {
    if (!this.transaction) {
      return '';
    }
    return this.transaction.approved ? 'TRANSACTIONS.STATUS.APPROVED' : 'TRANSACTIONS.STATUS.PENDING';
  }

  getAmountClass(): string {
    if (!this.transaction) {
      return '';
    }
    return this.transaction.direction === TransactionDirection.INBOUND ? 'amount-positive' : 'amount-negative';
  }

  getSupplierLabel(): string {
    const supplier = this.transaction?.supplier ?? this.transaction?.supplierId;
    if (supplier) {
      const fullName = [supplier.name, supplier.lastname].filter(Boolean).join(' ').trim();
      if (fullName) {
        return fullName;
      }
      if (supplier.id) {
        return supplier.id;
      }
    }
    return this.transaction?.vendorName || '—';
  }

  getBankAccountLabel(): string {
    const account = this.transaction?.bankAccount;
    if (!account) {
      return '—';
    }
    const parts = [account.bankName, account.rib || account.iban].filter(Boolean);
    return parts.join(' · ') || '—';
  }

  get resourceLinks(): FinanceResourceLink[] {
    return resolveFinanceResourceLinks(this.transaction);
  }

  hasReferences(): boolean {
    return !!(
      this.resourceLinks.length ||
      this.transaction?.lotNumber ||
      this.transaction?.invoiceReference ||
      this.transaction?.receiptReference ||
      this.transaction?.externalTransactionId
    );
  }

  hasParties(): boolean {
    const label = this.getSupplierLabel();
    return !!label && label !== '—';
  }

  hasPaymentDetails(): boolean {
    return !!(
      this.transaction?.checkNumber ||
      this.transaction?.bankAccount ||
      this.transaction?.paidAmount != null ||
      this.transaction?.unpaidAmount != null
    );
  }

  hasApprovalInfo(): boolean {
    return !!(this.transaction?.approvedBy || this.transaction?.approvalDate || this.transaction?.approved != null);
  }

  hasAuditInfo(): boolean {
    return !!(this.transaction?.createdBy || this.transaction?.createdDate || this.transaction?.lastModifiedDate);
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

  private buildBillRequest(profile: CompanyProfile): TransactionBillRequest {
    const request: TransactionBillRequest = {
      title: 'Facture commerciale',
      issuer: this.toIssuerParty(profile),
      logoBase64: profile.logoData,
      logoContentType: profile.logoContentType,
      designation: this.transaction ? resolveBillDesignation(this.translate, this.transaction) : '',
      conditions: this.transaction ? resolveBillConditions(this.translate, this.transaction) : undefined,
      footerContact: {
        companyName: profile.legalName,
        phone: profile.phone
      },
      notes: this.transaction?.lotNumber ? `Lot: ${this.transaction.lotNumber}` : undefined
    };
    if (this.transaction && isPurchaseBillTransaction(this.transaction)) {
      request.vatRatePercent = TUNISIA_VAT_STANDARD_RATE;
    }
    return request;
  }


  getQrCodeText(): string {
    return this.transaction?.publicCode?.trim() || this.transaction?.qrHex?.trim() || '';
  }

  hasQrCode(): boolean {
    return !!this.getQrCodeText();
  }

  hasCompleteQrMetadata(): boolean {
    return !!this.getQrCodeText() && !!this.transaction?.qrImageBase64?.trim();
  }


  openExistingQrDialog(): void {
    if (!this.hasCompleteQrMetadata() || !this.transaction) {
      return;
    }
    openQrDialog(this.dialog, {
      code: this.getQrCodeText(),
      qrImageBase64: this.transaction.qrImageBase64 || '',
      payloadType: 'FINANCIALTRANSACTION'
    });
  }


  canRegenerateExistingQr(): boolean {
    return canRegenerateQr(this.auth, OOSMModule.FINANCE, FinanceEntity.FINANCIALTRANSACTION);
  }

  generateQr(): void {
    if (this.hasQrCode() && !this.canRegenerateExistingQr()) {
      this.toast.error('QR.ERROR.NO_REGENERATE_PERMISSION');
      return;
    }
    if (this.generatingQr || !this.transaction?.id) {
      return;
    }
    this.confirmQrRegeneration((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.generatingQr = true;
      this.transactionService.generateQr(this.transaction!.id!).subscribe({
        next: (response) => {
          this.generatingQr = false;
          this.transaction = {
            ...this.transaction!,
            publicCode: response.publicCode,
            qrHex: response.publicCode,
            qrUrl: response.qrUrl,
            qrImageBase64: response.qrImageBase64
          };
          openQrDialog(this.dialog, {
            code: response.publicCode,
            qrImageBase64: response.qrImageBase64,
            payloadType: 'FINANCIALTRANSACTION'
          });
        },
        error: () => {
          this.generatingQr = false;
          this.toast.error('QR.ERROR.GENERATE');
        }
      });
    });
  }

  private confirmQrRegeneration(onResolved: (confirmed: boolean) => void): void {
    if (!this.hasQrCode()) {
      onResolved(true);
      return;
    }
    this.confirmationDialog
      .confirm({
        title: this.translate.instant('AUTO.REGENERATE_QR_CODE'),
        message: this.translate.instant('AUTO.THIS_WILL_REGENERATE_THE_QR_CODE_AND_MAY_INVALIDATE_ALREADY_PRIN'),
        type: ConfirmationType.WARNING,
        confirmText: this.translate.instant('AUTO.REGENERATE'),
        cancelText: this.translate.instant('COMMON.CANCEL'),
        showIcon: true,
        destructive: true,
        requiredText: this.translate.instant('AUTO.OKAY'),
        requiredTextHint: this.translate.instant('AUTO.TO_CONTINUE_TYPE_OKAY_IN_THE_FIELD_BELOW'),
        requiredTextPlaceholder: this.translate.instant('AUTO.TYPE_OKAY')
      })
      .pipe(take(1))
      .subscribe((result) => onResolved(!!result?.confirmed));
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

  private extractPdfFileName(contentDisposition: string | null): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
    if (match?.[1]) {
      return match[1];
    }
    return `facture-${this.transaction?.invoiceReference || this.transaction?.id || 'transaction'}.pdf`;
  }
}
