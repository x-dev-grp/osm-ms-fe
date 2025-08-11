import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinancialTransaction, TransactionType, TransactionDirection, Currency, PaymentMethod } from '../../models/financial-transaction.model';
import { FinancialTransactionService } from '../../service/financial-transaction.service';

@Component({
  selector: 'app-transaction-view',
  templateUrl: './transaction-view.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  styleUrls: ['./transaction-view.component.scss']
})
export class TransactionViewComponent implements OnInit {
  transaction?: FinancialTransaction;
  loading = true;
  error = false;
  isPrintMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: FinancialTransactionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check if this is print mode
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
          this.transaction = response.data[0];
        } else {
          this.error = true;
          this.showError('Transaction non trouvée');
        }
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.showError('Erreur lors du chargement de la transaction');
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

  onDuplicate(): void {
    if (this.transaction?.id) {
      this.router.navigate(['/finance/transactions/new'], {
        queryParams: {
          duplicate: 'true',
          transactionType: this.transaction.transactionType,
          direction: this.transaction.direction,
          amount: this.transaction.amount,
          currency: this.transaction.currency,
          paymentMethod: this.transaction.paymentMethod,
          description: this.transaction.description,
          lotNumber: this.transaction.lotNumber
        }
      });
    }
  }

  getTransactionTypeLabel(type: TransactionType): string {
    const typeLabels: { [key in TransactionType]: string } = {
      [TransactionType.PAYMENT]: 'Paiement',
      [TransactionType.EXPENSE]: 'Dépense',
      [TransactionType.PURCHASE]: 'Achat',
      [TransactionType.CREDIT]: 'Crédit',
      [TransactionType.DEBIT]: 'Débit',
      [TransactionType.LOAN]: 'Prêt',
      [TransactionType.INTERNAL_TRANSFER]: 'Transfert Interne',
      [TransactionType.OIL_SALE]: 'Vente d\'Huile',
      [TransactionType.OIL_PURCHASE]: 'Achat d\'Huile',
      [TransactionType.SUPPLIER_PAYMENT]: 'Paiement Fournisseur',
      [TransactionType.SUPPLIER_CREDIT]: 'Crédit Fournisseur',
      [TransactionType.DEPOSIT]: 'Dépôt',
      [TransactionType.WITHDRAWAL]: 'Retrait',
      [TransactionType.CHECK_DEPOSIT]: 'Dépôt de Chèque',
      [TransactionType.CHECK_PAYMENT]: 'Paiement par Chèque'
    };
    return typeLabels[type] || type;
  }

  getDirectionLabel(direction: TransactionDirection): string {
    const directionLabels: { [key in TransactionDirection]: string } = {
      [TransactionDirection.INBOUND]: 'Entrée',
      [TransactionDirection.OUTBOUND]: 'Sortie',
      [TransactionDirection.INTERNAL]: 'Interne'
    };
    return directionLabels[direction] || direction;
  }



  getCurrencyLabel(currency: Currency): string {
    const currencyLabels: { [key in Currency]: string } = {
      [Currency.TND]: 'Dinar Tunisien',
      [Currency.EUR]: 'Euro',
      [Currency.USD]: 'Dollar US'
    };
    return currencyLabels[currency] || currency;
  }

  getStatusClass(): string {
    if (!this.transaction) return '';

    if (this.transaction.approved) {
      return 'status-approved';
    } else {
      return 'status-pending';
    }
  }

  getStatusLabel(): string {
    if (!this.transaction) return '';

    if (this.transaction.approved) {
      return 'Approuvée';
    } else {
      return 'En attente';
    }
  }

  getAmountClass(): string {
    if (!this.transaction) return '';

    if (this.transaction.direction === TransactionDirection.INBOUND) {
      return 'amount-positive';
    } else {
      return 'amount-negative';
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
