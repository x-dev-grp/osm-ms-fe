import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductionTraceabilityService } from '../../services/production-traceability.service';
import { ProductionGenealogy } from '../../models/production-genealogy.model';
import { oilReceptionsFromGenealogy, OilReceptionDisplay } from '../../utils/traceability-display.util';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-traceability-preview',
  standalone: true,
  imports: [TranslateModule, CommonModule, DatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './traceability-preview.component.html',
  styleUrls: ['./traceability-preview.component.scss']
})
export class TraceabilityPreviewComponent implements OnChanges {
  @Input() anchorId: string | null = null;

  readonly loading = signal(false);
  readonly genealogy = signal<ProductionGenealogy | null>(null);
  readonly error = signal<string | null>(null);

  constructor(private readonly productionTraceability: ProductionTraceabilityService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['anchorId']) {
      this.loadGenealogy();
    }
  }

  oilReceptions(): OilReceptionDisplay[] {
    return oilReceptionsFromGenealogy(this.genealogy());
  }

  receptionSummary(rec: OilReceptionDisplay): string {
    const parts = [rec.supplierName || '—', rec.lotNumber ? `lot ${rec.lotNumber}` : ''].filter(Boolean);
    if (rec.deliveryNumber) {
      parts.push(`n° ${rec.deliveryNumber}`);
    }
    if (rec.quantityKg != null) {
      parts.push(`${rec.quantityKg} kg`);
    }
    return parts.join(' · ');
  }

  private loadGenealogy(): void {
    const anchor = this.anchorId?.trim();
    if (!anchor) {
      this.genealogy.set(null);
      this.error.set(null);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.productionTraceability.getGenealogy(anchor).subscribe({
      next: (genealogy) => {
        this.genealogy.set(genealogy);
        this.loading.set(false);
      },
      error: () => {
        this.genealogy.set(null);
        this.error.set('Généalogie indisponible pour cette cuve.');
        this.loading.set(false);
      }
    });
  }
}
