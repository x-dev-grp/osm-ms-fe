import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { LabelPreviewViewModel } from '../../models/label-preview.model';

@Component({
  selector: 'app-label-preview-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './label-preview-card.component.html',
  styleUrls: ['./label-preview-card.component.scss']
})
export class LabelPreviewCardComponent {
  @Input({ required: true }) preview!: LabelPreviewViewModel;
  @Input() size: 'miniature' | 'full' = 'miniature';
}
