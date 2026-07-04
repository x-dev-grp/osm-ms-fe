import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CardComponent } from '../../../theme/components/card/card.component';
import { WasteSale } from '../../models/Waste.model';
import { WasteSaleService } from '../../service/wasteSale.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { buildTransactionsQueryParams } from '../../utils/finance-resource-links.util';

@Component({
  selector: 'app-waste-view',
  standalone: true,
  imports: [TranslateModule, CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, CardComponent],
  templateUrl: './waste-view.component.html',
  styleUrl: './waste-view.component.scss'
})
export class WasteViewComponent implements OnInit {
  wasteSale: WasteSale | null = null;
  loading: boolean = true;
  wasteId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wasteSaleService: WasteSaleService,
    private toast: ToastService
  ) {
    this.wasteId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    if (this.wasteId) {
      this.loadWasteSale();
    } else {
      this.toast.error('AUTO.ID_DE_VENTE_DE_DECHET_MANQUANT');
      this.onBack();
    }
  }

  onBack(): void {
    this.router.navigate(['/finance/waste-sales']);
  }

  onEdit(): void {
    this.router.navigate(['/finance/waste-sales', this.wasteId, 'edit']);
  }

  openFinancialTransactions(): void {
    this.router.navigate(['/finance/transactions'], {
      queryParams: buildTransactionsQueryParams({ externalTransactionId: this.wasteId })
    });
  }

  openSupplierFinance(): void {
    const supplierId = this.wasteSale?.supplier?.id;
    if (!supplierId) {
      return;
    }
    this.router.navigate(['/reception/fournisseur/details', supplierId], { queryParams: { tab: 'finance' } });
  }

  getWasteTypeDisplay(type: string): string {
    switch (type) {
      case 'MARGINE':
        return 'Margine';
      case 'POMACE':
        return 'Grignon';
      case 'VEGETAL_SOLIDS':
        return 'Solides végétaux';
      case 'OTHER':
        return 'Autre';
      default:
        return 'Non spécifié';
    }
  }

  getSupplierDisplay(): string {
    if (this.wasteSale?.supplier) {
      const supplier = this.wasteSale.supplier;
      if (typeof supplier === 'object' && 'supplierInfo' in supplier) {
        return `${supplier.name} ${supplier.lastname}`;
      }
    }
    return 'Non spécifié';
  }

  private loadWasteSale(): void {
    this.loading = true;
    this.wasteSaleService.getWasteSale(this.wasteId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.wasteSale = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          this.toast.error('AUTO.VENTE_DE_DECHET_INTROUVABLE');
          this.onBack();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading waste sale:', error);
        this.toast.error('CONTROLE_QUALITE.MESSAGES.ERROR.LOAD');
        this.onBack();
      }
    });
  }
}
