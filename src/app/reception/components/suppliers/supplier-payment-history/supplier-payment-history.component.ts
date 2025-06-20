import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupplierTypeService } from '../../../../shared/services/supplier.service';
import { Location } from '@angular/common';

interface Payment {
  id: string;
  date: Date;
  amount: number;
  status: 'paid' | 'unpaid';
  reference: string;
}

@Component({
  selector: 'app-supplier-payment-history',
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
    MatChipsModule
  ],
  templateUrl: './supplier-payment-history.component.html',
  styleUrls: ['./supplier-payment-history.component.scss']
})
export class SupplierPaymentHistoryComponent implements OnInit {
  supplierId!: string | null;
  historyType: 'paid' | 'unpaid' = 'paid';
  loading = true;
  error: string | null = null;
  payments: Payment[] = [];
  displayedColumns: string[] = ['date', 'amount', 'status', 'reference', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.historyType = this.route.snapshot.queryParams['type'] || 'paid';

    if (!this.supplierId) {
      this.error = 'ID du fournisseur non trouvé';
      this.loading = false;
      return;
    }

    this.loadPaymentHistory();
  }

  onBack(): void {
    const supplierId = localStorage.getItem('selectedSupplierId');
    if (supplierId) {
      localStorage.setItem('selectedSupplierId',supplierId);
      this.router.navigate(['/reception/fournisseur/details']);
    }
   }

  loadPaymentHistory(): void {
    // TODO: Replace with actual API call
    this.loading = true;
    this.error = null;

    // Simulated data for now
    setTimeout(() => {
      this.payments = [
        {
          id: '1',
          date: new Date('2024-03-15'),
          amount: 15000,
          status: 'paid',
          reference: 'PAY-001'
        },
        {
          id: '2',
          date: new Date('2024-03-10'),
          amount: 25000,
          status: this.historyType,
          reference: 'PAY-002'
        }
      ];
      this.loading = false;
    }, 1000);
  }

  viewPaymentDetails(): void {
    // TODO: Implement payment details view
    this.snackBar.open('Détails du paiement à implémenter', 'Fermer', {
      duration: 3000
    });
  }
}
