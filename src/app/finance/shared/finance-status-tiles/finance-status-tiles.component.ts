import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../../theme/components/card/card.component';

export interface FinanceStatusTile {
  title: string;
  icon: string;
  background: string;
  route?: string;
}

@Component({
  selector: 'app-finance-status-tiles',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent],
  templateUrl: './finance-status-tiles.component.html'
})
export class FinanceStatusTilesComponent {
  readonly tiles = input.required<FinanceStatusTile[]>();
}
