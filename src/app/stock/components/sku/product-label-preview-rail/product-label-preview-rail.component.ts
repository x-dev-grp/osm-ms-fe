import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { LabelService } from '../../../../labels/services/label.service';
import { CertificationService } from '../../../../labels/services/certification.service';
import { LabelContentDto } from '../../../../labels/models/label.model';
import { Certification } from '../../../../labels/models/certification.model';
import {
  LabelPreviewCarouselComponent,
  LabelPreviewCarouselSlide
} from '../../../../labels/components/label-preview-carousel/label-preview-carousel.component';
import {
  LabelPreviewDialogComponent,
  LabelPreviewDialogData
} from '../../../../labels/components/label-preview-dialog/label-preview-dialog.component';
import {
  buildLabelPreviewViewModel,
  formatLabelPayloadJson,
  labelDtoToFormValues
} from '../../../../labels/utils/label-preview-payload.util';
import {
  PREVIEW_CAROUSEL_LANGUAGES,
  previewLanguageLabel
} from '../../../../labels/utils/label-preview-localization.util';
import { resolvePostFiltrationQualityControls } from '../../../../labels/utils/label-qc-composition.util';
import { extractCompositionOverrides } from '../../../../labels/utils/label-compliance.util';
import { resolveQualityGradeLabel } from '../../../../shared/models/quality-grades.enum';
import { CompanyProfileService } from '../../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../../shared/models/CompanyProfile';
import { FinalProductType } from '../../../models/final-product.model';

@Component({
  selector: 'app-product-label-preview-rail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LabelPreviewCarouselComponent
  ],
  templateUrl: './product-label-preview-rail.component.html',
  styleUrls: ['./product-label-preview-rail.component.scss']
})
export class ProductLabelPreviewRailComponent implements OnChanges {
  @Input() productId?: string;
  @Input() productType: FinalProductType = 'NON_VRAC';

  loading = false;
  primaryLabel: LabelContentDto | null = null;
  carouselSlides: LabelPreviewCarouselSlide[] = [];

  private certifications: Certification[] = [];
  private companyProfile: CompanyProfile | null = null;

  constructor(
    private readonly labelService: LabelService,
    private readonly certificationService: CertificationService,
    private readonly companyProfileService: CompanyProfileService,
    private readonly dialog: MatDialog
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('productId' in changes || 'productType' in changes) {
      this.loadRail();
    }
  }

  get canCreateLabel(): boolean {
    return !!this.productId && this.productType === 'NON_VRAC';
  }

  get labelCreateLink(): string[] {
    return ['/labels/new'];
  }

  get labelCreateQueryParams(): Record<string, string> {
    return this.productId ? { packagingId: this.productId } : {};
  }

  get labelEditLink(): string[] {
    return this.primaryLabel?.id ? ['/labels', this.primaryLabel.id] : ['/labels/new'];
  }

  statusLabel(status?: string): string {
    switch (status) {
      case 'FINALIZED':
        return 'Finalisee';
      case 'VALIDATED':
        return 'Validee';
      case 'EXPORTED_JSON':
        return 'Exportee';
      default:
        return 'Brouillon';
    }
  }

  openPreviewDialog(slide?: LabelPreviewCarouselSlide): void {
    if (!this.carouselSlides.length) {
      return;
    }

    const data: LabelPreviewDialogData = {
      slides: this.carouselSlides,
      payloadJson: this.primaryLabel?.finalPayloadJson
        ? formatLabelPayloadJson(this.primaryLabel.finalPayloadJson)
        : '{}',
      initialLanguage: slide?.language
    };

    this.dialog.open(LabelPreviewDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      maxHeight: '95vh',
      panelClass: 'label-preview-dialog-panel',
      data
    });
  }

  private loadRail(): void {
    if (!this.productId) {
      this.primaryLabel = null;
      this.carouselSlides = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    forkJoin({
      labels: this.labelService.getByProductId(this.productId).pipe(catchError(() => of([]))),
      certifications: this.certificationService.getAll().pipe(catchError(() => of([]))),
      profile: this.companyProfileService.getProfile().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ labels, certifications, profile }) => {
        this.certifications = certifications ?? [];
        this.companyProfile = profile;
        this.primaryLabel = this.pickPrimaryLabel(labels ?? []);
        this.carouselSlides = this.primaryLabel ? this.buildSlides(this.primaryLabel) : [];
        this.loading = false;
      },
      error: () => {
        this.primaryLabel = null;
        this.carouselSlides = [];
        this.loading = false;
      }
    });
  }

  private pickPrimaryLabel(labels: LabelContentDto[]): LabelContentDto | null {
    if (!labels.length) {
      return null;
    }

    const statusRank: Record<string, number> = {
      FINALIZED: 4,
      EXPORTED_JSON: 3,
      VALIDATED: 2,
      DRAFT: 1
    };

    return [...labels].sort((a, b) => {
      const rankDiff = (statusRank[b.status] ?? 0) - (statusRank[a.status] ?? 0);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      return bTime - aTime;
    })[0];
  }

  private buildSlides(label: LabelContentDto): LabelPreviewCarouselSlide[] {
    const form = labelDtoToFormValues(label);
    const baseOptions = {
      form,
      currentLabel: label,
      certifications: this.certifications,
      brandName: this.companyProfile?.legalName,
      brandLogoData: this.companyProfile?.logoData,
      brandLogoContentType: this.companyProfile?.logoContentType,
      postFiltrationQualityControls: resolvePostFiltrationQualityControls(label),
      compositionOverrides: extractCompositionOverrides(label.nutritionDeclarationJson),
      genealogy: null,
      productDensity: null,
      resolveQualityLabel: (value: string | null | undefined) => resolveQualityGradeLabel(value),
      resolveVarietyLabel: (value: string | null | undefined) => value?.trim() || '-',
      resolveClaimLabel: (value: string) => String(value)
    };

    return PREVIEW_CAROUSEL_LANGUAGES.map((language) => ({
      language,
      label: previewLanguageLabel(language),
      preview: buildLabelPreviewViewModel({
        ...baseOptions,
        previewLanguage: language
      })
    }));
  }
}
