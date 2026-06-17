import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChip, MatChipListbox } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';

import { StockService } from '../../../services/stock.service';
import { MouvementStock } from '../../../models/mouvement-stock.model';

@Component({
  selector: 'app-mouvement-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipListbox,
    MatChip,
    TranslateModule
  ],
  templateUrl: './mouvement-detail.component.html',
  styleUrls: ['./mouvement-detail.component.scss']
})
export class MouvementDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly stockService = inject(StockService);

  loading = true;
  errorMessage: string | null = null;
  mouvement: MouvementStock | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.errorMessage = 'Identifiant absent.';
      return;
    }

    this.stockService.getMouvementById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (mouvement: MouvementStock) => {
        this.mouvement = mouvement;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de charger le mouvement.';
      }
    });
  }

  backToList(): void {
    void this.router.navigate(['/stock/mouvements']);
  }

  movementTypeLabel(type?: string): string {
    switch (type) {
      case 'ENTREE':
        return 'Entrée';
      case 'SORTIE':
        return 'Sortie';
      case 'AJUSTEMENT':
        return 'Ajustement';
      default:
        return type || 'N/A';
    }
  }
}
