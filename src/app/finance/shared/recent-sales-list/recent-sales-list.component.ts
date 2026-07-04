import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from '../../../theme/components/card/card.component';

export interface RecentSaleItem {
  id?: string;
  name: string;
  amount: string;
  dateLabel: string;
  invoiceRef?: string;
}

@Component({
  selector: 'app-recent-sales-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatMenuModule, TranslateModule, CardComponent],
  templateUrl: './recent-sales-list.component.html'
})
export class RecentSalesListComponent {
  readonly items = input.required<RecentSaleItem[]>();
  readonly viewAllRoute = input('/finance/oil-sales');
}
