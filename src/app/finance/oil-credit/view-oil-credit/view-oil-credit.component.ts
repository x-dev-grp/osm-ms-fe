import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { CreditState, OilCredit, UnitType } from '../../models/OilCredit';
import { OilCreditService } from '../../service/oil-credit.service';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    MatTooltip,
    TranslateModule
  ],
  templateUrl: './view-oil-credit.component.html',
  styleUrls: ['./view-oil-credit.component.scss']
})
export class ViewOilCreditComponent implements OnInit {
  credit: OilCredit | null = null;
  loading = true;
  error = false;

  private svc = inject(OilCreditService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  protected creditStateLabel: string = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOilCredit(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  private loadOilCredit(id: string): void {
    this.loading = true;
    this.error = false;

    this.svc.getOilCredit(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.credit = res.data;
          this.creditStateLabel = this.getCreditStateLabel(this.credit!.creditState);
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
  getCreditStateLabel(state: CreditState): string {
    const labels: Record<CreditState, string> = {
      [CreditState.PENDING]: this.translate.instant('OIL_CREDIT.STATES.PENDING'),
      [CreditState.APPROVED]: this.translate.instant('OIL_CREDIT.STATES.APPROVED'),
      [CreditState.REJECTED]: this.translate.instant('OIL_CREDIT.STATES.REJECTED'),
      [CreditState.COMPLETED]: this.translate.instant('OIL_CREDIT.STATES.COMPLETED'),
      [CreditState.CANCELLED]: this.translate.instant('OIL_CREDIT.STATES.CANCELLED')
    };
    return labels[state] || state;
  }

  getUnitLabel(unit: UnitType): string {
    if (unit === UnitType.L) {
      return this.translate.instant('OIL_CREDIT.UNITS.LITER');
    } else {
      return this.translate.instant('OIL_CREDIT.UNITS.KILOGRAM');
    }
  }

  getCreditStateClass(state: CreditState): string {
    const classes: Record<CreditState, string> = {
      [CreditState.PENDING]: 'state-pending',
      [CreditState.APPROVED]: 'state-approved',
      [CreditState.REJECTED]: 'state-rejected',
      [CreditState.COMPLETED]: 'state-completed',
      [CreditState.CANCELLED]: 'state-cancelled'
    };
    return classes[state] || '';
  }
}
