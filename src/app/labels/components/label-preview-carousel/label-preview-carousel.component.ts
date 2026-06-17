import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LabelLanguage } from '../../models/label.model';
import { LabelPreviewViewModel } from '../../models/label-preview.model';
import { LabelPreviewCardComponent } from '../label-preview-card/label-preview-card.component';
import { previewLanguageLabel } from '../../utils/label-preview-localization.util';

export interface LabelPreviewCarouselSlide {
  language: LabelLanguage;
  label: string;
  preview: LabelPreviewViewModel;
}

@Component({
  selector: 'app-label-preview-carousel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, LabelPreviewCardComponent],
  templateUrl: './label-preview-carousel.component.html',
  styleUrls: ['./label-preview-carousel.component.scss']
})
export class LabelPreviewCarouselComponent implements OnChanges {
  @Input({ required: true }) slides: LabelPreviewCarouselSlide[] = [];
  @Input() size: 'miniature' | 'full' = 'miniature';
  @Input() showExpand = true;
  @Input() initialLanguage?: LabelLanguage | null;
  @Output() expand = new EventEmitter<LabelPreviewCarouselSlide>();

  @ViewChild('viewport') private viewport?: ElementRef<HTMLElement>;

  activeIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slides'] || changes['initialLanguage']) {
      this.syncActiveIndex();
    }
  }

  private syncActiveIndex(): void {
    if (!this.slides.length) {
      this.activeIndex = 0;
      return;
    }

    if (this.initialLanguage) {
      const index = this.slides.findIndex((slide) => slide.language === this.initialLanguage);
      if (index >= 0) {
        this.activeIndex = index;
        this.resetViewportScroll();
        return;
      }
    }

    if (this.activeIndex >= this.slides.length) {
      this.activeIndex = 0;
    }

    this.resetViewportScroll();
  }

  private resetViewportScroll(): void {
    const element = this.viewport?.nativeElement;
    if (element) {
      element.scrollTop = 0;
    }
  }

  get activeSlide(): LabelPreviewCarouselSlide | null {
    return this.slides[this.activeIndex] ?? null;
  }

  select(index: number): void {
    if (index < 0 || index >= this.slides.length) {
      return;
    }
    this.activeIndex = index;
    this.resetViewportScroll();
  }

  previous(): void {
    if (!this.slides.length) {
      return;
    }
    this.activeIndex = (this.activeIndex - 1 + this.slides.length) % this.slides.length;
    this.resetViewportScroll();
  }

  next(): void {
    if (!this.slides.length) {
      return;
    }
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.resetViewportScroll();
  }

  languageLabel(language: LabelLanguage): string {
    return previewLanguageLabel(language);
  }

  isRtl(language: LabelLanguage): boolean {
    return language === 'AR';
  }

  onExpand(): void {
    const slide = this.activeSlide;
    if (slide) {
      this.expand.emit(slide);
    }
  }

  trackByLanguage(_index: number, slide: LabelPreviewCarouselSlide): string {
    return slide.language;
  }
}
