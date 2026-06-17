import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { QcChecklistSummary } from '../../models/qc-context.model';

@Component({
  selector: 'app-qc-compliance-rail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './qc-compliance-rail.component.html',
  styleUrls: ['./qc-compliance-rail.component.scss']
})
export class QcComplianceRailComponent {
  @Input({ required: true }) summary!: QcChecklistSummary;
  @Input() expanded = true;

  toggle(): void {
    this.expanded = !this.expanded;
  }
}
