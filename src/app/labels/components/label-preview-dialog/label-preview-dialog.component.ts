import { CommonModule } from '@angular/common';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LabelPreviewViewModel } from '../../models/label-preview.model';
import { LabelPreviewCardComponent } from '../label-preview-card/label-preview-card.component';
import { LabelPreviewCarouselComponent, LabelPreviewCarouselSlide } from '../label-preview-carousel/label-preview-carousel.component';
import { TranslateModule } from '@ngx-translate/core';

export interface LabelPreviewDialogData {
  viewModel?: LabelPreviewViewModel;
  slides?: LabelPreviewCarouselSlide[];
  payloadJson: string;
  initialLanguage?: string;
}

@Component({
  selector: 'app-label-preview-dialog',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    LabelPreviewCardComponent,
    LabelPreviewCarouselComponent
  ],
  templateUrl: './label-preview-dialog.component.html',
  styleUrls: ['./label-preview-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LabelPreviewDialogComponent {
  showJson = false;

  constructor(
    private readonly dialogRef: MatDialogRef<LabelPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: LabelPreviewDialogData
  ) {}

  get carouselSlides(): LabelPreviewCarouselSlide[] {
    if (this.data.slides?.length) {
      return this.data.slides;
    }

    if (this.data.viewModel) {
      return [
        {
          language: (this.data.viewModel.language as LabelPreviewCarouselSlide['language']) || 'FR',
          label: String(this.data.viewModel.language || 'FR'),
          preview: this.data.viewModel
        }
      ];
    }

    return [];
  }

  get usesCarousel(): boolean {
    return this.carouselSlides.length > 1;
  }

  close(): void {
    this.dialogRef.close();
  }

  toggleJson(): void {
    this.showJson = !this.showJson;
  }
}
