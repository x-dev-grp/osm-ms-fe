import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { LabelPreviewViewModel } from '../../models/label-preview.model';
import { TranslateModule } from '@ngx-translate/core';
import { EanBarcodeComponent } from '../ean-barcode/ean-barcode.component';

@Component({
  selector: 'app-label-preview-card',
  standalone: true,
  imports: [TranslateModule, CommonModule, MatIconModule, EanBarcodeComponent],
  templateUrl: './label-preview-card.component.html',
  styleUrls: ['./label-preview-card.component.scss']
})
export class LabelPreviewCardComponent {
  @Input({ required: true }) preview!: LabelPreviewViewModel;
  @Input() size: 'miniature' | 'full' = 'miniature';
}
