import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LabelCompositionSource } from '../../models/label-qc-composition.model';
import { LabelPreviewViewModel } from '../../models/label-preview.model';
import { nutritionSourceLabel } from '../../utils/label-qc-composition.util';

@Component({
  selector: 'app-label-preview-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './label-preview-card.component.html',
  styleUrls: ['./label-preview-card.component.scss']
})
export class LabelPreviewCardComponent {
  @Input({ required: true }) preview!: LabelPreviewViewModel;
  @Input() size: 'miniature' | 'full' = 'miniature';

  sourceLabel(source: LabelCompositionSource): string {
    return nutritionSourceLabel(source, this.preview.language);
  }
}
