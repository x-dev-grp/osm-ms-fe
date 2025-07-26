import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { OilCredit, CreditState, UnitType } from '../../models/OilCredit';
import { OilCreditService } from '../../service/oil-credit.service';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-oil-credit',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCard,
    MatTooltip,TranslateModule
  ],
  templateUrl: './view-oil-credit.component.html',
  styleUrls: ['./view-oil-credit.component.scss']
})
export class ViewOilCreditComponent implements OnInit {
  credit: OilCredit;
  loading = true;
  error = false;

  private svc = inject(OilCreditService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected creditStateLabel: string;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOilCredit(id);

    }
  }

  private loadOilCredit(id: string): void {
    this.loading = true;
    this.svc.getOilCredit(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.credit = res.data;
          this.creditStateLabel = this.getCreditStateLabel(this.credit);

        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading oil credit:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/finance/oil-credit']);
  }

  onPrint(): void {
    window.print();
  }

  // Helper methods for display
  getCreditStateLabel(credit: OilCredit): string {
    const labels = {
      [CreditState.PENDING]: 'En attente',
      [CreditState.APPROVED]: 'Approuvé',
      [CreditState.REJECTED]: 'Rejeté',
      [CreditState.COMPLETED]: 'Terminé',
      [CreditState.CANCELLED]: 'Annulé'
    };
    return labels[credit.creditState] || credit.creditState;
  }

  getUnitLabel(unit: UnitType): string {
    return unit === UnitType.L ? 'Litre' : 'Kilogramme';
  }

  getCreditStateClass(state: CreditState): string {
    const classes = {
      [CreditState.PENDING]: 'state-pending',
      [CreditState.APPROVED]: 'state-approved',
      [CreditState.REJECTED]: 'state-rejected',
      [CreditState.COMPLETED]: 'state-completed',
      [CreditState.CANCELLED]: 'state-cancelled'
    };
    return classes[state] || '';
  }
}
