import { Component, ViewEncapsulation } from '@angular/core';
import { SupplierPaymentHistoryComponent } from '../supplier-payment-history/supplier-payment-history.component';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-supplier-payment-history-mobile',
  templateUrl: './supplier-payment-history-mobile.component.html',
  styleUrls: ['./supplier-payment-history-mobile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDividerModule,
    MatChipsModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  encapsulation: ViewEncapsulation.None
})
export class SupplierPaymentHistoryMobileComponent extends SupplierPaymentHistoryComponent {
  // Helpers for concise template conditions
  get method(): 'cash' | 'oil' | 'both' {
    return this.paymentForm?.value?.paymentMethod;
  }
  get moneyMethod(): 'cash' | 'check' | 'bank_transfer' {
    return this.paymentForm?.value?.moneyPaymentMethod;
  }
  get showMoney(): boolean {
    return this.method === 'cash' || this.method === 'both';
  }
  get showOil(): boolean {
    return this.method === 'oil' || this.method === 'both';
  }
  // ===== Enhanced summary helpers =====
  get total(): number {
    return Number(this.totalPrice || 0);
  }
  get remaining(): number {
    return Number(this.remainingAmount || 0);
  }
  get paidSoFar(): number {
    // what’s considered paid = total - remaining (bounded)
    const v = this.total - this.remaining;
    return Math.max(0, isFinite(v) ? v : 0);
  }
  get progressPct(): number {
    if (!this.total || this.total <= 0) return 0;
    const pct = (this.paidSoFar / this.total) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }
  get summaryStatus(): { label: string; icon: string; cls: 'ok' | 'warn' | 'bad' } {
    if (this.total <= 0) return { label: '—', icon: 'help', cls: 'warn' };
    if (this.remaining <= 0) return { label: 'Réglé', icon: 'check_circle', cls: 'ok' };
    if (this.paidSoFar > 0) return { label: 'Partiel', icon: 'hourglass_bottom', cls: 'warn' };
    return { label: 'Impayé', icon: 'error', cls: 'bad' };
  }
}
