import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QcChecklistSummary } from '../../models/qc-context.model';

@Component({
  selector: 'app-qc-compliance-rail',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './qc-compliance-rail.component.html',
  styleUrls: ['./qc-compliance-rail.component.scss']
})
export class QcComplianceRailComponent {
  @Input({ required: true }) summary!: QcChecklistSummary;
  @Input() expanded = true;
  @Output() expandedChange = new EventEmitter<boolean>();

  toggle(): void {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
