import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BomService } from '../../../stock/services/BomService';
import { MaterialNeedLine } from '../../models/material-need-line.model';

@Component({
  selector: 'app-material-needs-preview',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './material-needs-preview.component.html',
  styleUrls: ['./material-needs-preview.component.scss']
})
export class MaterialNeedsPreviewComponent implements OnChanges {
  @Input() bomId: string | null = null;
  @Input() quantity = 0;
  @Input() quantityLabel = 'Quantité cible';
  @Input() title = 'Besoins matières vs stock';
  @Input() useReservedStock = false;

  lines: MaterialNeedLine[] = [];
  loading = false;
  error: string | null = null;

  constructor(private bomService: BomService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bomId'] || changes['quantity']) {
      this.load();
    }
  }

  load(): void {
    if (!this.bomId || !this.quantity || this.quantity <= 0) {
      this.lines = [];
      this.error = null;
      return;
    }

    this.loading = true;
    this.error = null;
    this.bomService.getMaterialNeeds(this.bomId, this.quantity).subscribe({
      next: (lines) => {
        this.lines = lines;
        this.loading = false;
      },
      error: (err) => {
        this.lines = [];
        this.loading = false;
        this.error = err?.error?.error || err?.error?.message || 'Impossible de charger les besoins matières';
      }
    });
  }

  availableQty(line: MaterialNeedLine): number {
    if (this.useReservedStock) {
      return line.quantiteReservee ?? 0;
    }
    return line.quantiteDisponible ?? 0;
  }

  stockLabel(): string {
    return this.useReservedStock ? 'Réservé' : 'Disponible';
  }

  get allSufficient(): boolean {
    return this.lines.length > 0 && this.lines.every((l) => this.isLineOk(l));
  }

  isLineOk(line: MaterialNeedLine): boolean {
    if (this.useReservedStock) {
      return (line.quantiteReservee ?? 0) >= line.quantityNeededRounded;
    }
    return line.sufficient;
  }
}
