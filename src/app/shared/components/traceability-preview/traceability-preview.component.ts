import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductionTraceabilityService } from '../../services/production-traceability.service';
import { ProductionGenealogy } from '../../models/production-genealogy.model';

@Component({
  selector: 'app-traceability-preview',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule, MatProgressSpinnerModule],
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

  rootSource(): string {
    const intake = this.genealogy()?.intakeChain;
    if (intake?.length) {
      const olive = intake.find((s) => s.type === 'OLIVE_RECEPTION');
      const oil = intake.find((s) => s.type === 'OIL_RECEPTION');
      if (olive) {
        return `${olive.supplierName || '—'} · olive ${olive.lotNumber || '—'}`;
      }
      if (oil) {
        return `${oil.supplierName || '—'} · huile ${oil.lotNumber || '—'}`;
      }
    }
    const root = this.genealogy()?.rootSources?.[0];
    if (!root) {
      return 'Origine non résolue';
    }
    return `${root.supplierName || '—'} · lot ${root.lotNumber || '—'}`;
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
