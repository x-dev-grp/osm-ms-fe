import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LabelCategory, LabelClaimType, LabelContentDto, LabelContentStatus, LabelValidationIssueDto } from '../../models/label.model';
import { LabelService } from '../../services/label.service';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';
import { LabelPreviewCardComponent } from '../label-preview-card/label-preview-card.component';
import {
  LabelPreviewDialogComponent,
  LabelPreviewDialogData
} from '../label-preview-dialog/label-preview-dialog.component';
import { LabelPreviewViewModel } from '../../models/label-preview.model';
import {
  buildLabelPreviewFromDto,
  formatLabelPayloadJson
} from '../../utils/label-preview-payload.util';
import {
  filterNonCompositionQualityControls,
  hasSensoryQualityControls,
  resolvePostFiltrationQualityControls,
  resolveSensoryProfileDisplay,
  resolveStorageConditionsDisplay
} from '../../utils/label-qc-composition.util';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CompanyProfileService } from '../../../shared/services/company-profile.service';
import { CompanyProfile } from '../../../shared/models/CompanyProfile';

import { BaseType } from '../../../shared/models/base-type';
import { GenericTypeService } from '../../../shared/services/generic-type.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TypeCategory } from "../../../shared/models/type-category.enum";
import { resolveQualityGradeLabel } from '../../../shared/models/quality-grades.enum';
import { ProductionGenealogy, ProductionRootSource } from '../../../shared/models/production-genealogy.model';
import { ProductionTraceabilityService } from '../../../shared/services/production-traceability.service';

@Component({
  selector: 'app-label-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    LabelPreviewCardComponent
  ],
  templateUrl: './label-detail.component.html',
  styleUrls: ['./label-detail.component.scss']
})
export class LabelDetailComponent implements OnInit, OnDestroy {
  label: LabelContentDto | null = null;
  currentGenealogy: ProductionGenealogy | null = null;
  availableCertifications: Certification[] = [];
  companyProfile: CompanyProfile | null = null;

  private readonly claimTypeOptions: { value: LabelClaimType; label: string }[] = [
    { value: 'MADE_IN_TUNISIA', label: 'Produit de Tunisie' },
    { value: 'BIO', label: 'Agriculture Biologique' },
    { value: 'COLD_EXTRACTION', label: 'Extraction à froid' },
    { value: 'PRIVATE_LABEL', label: 'Marque Privée' },
    { value: 'OTHER', label: 'Autre' }
  ];

  loading = false;
  loadingTypes = false;
  exporting = false;
  unlocking = false;
  deleting = false;

  errorMessage = '';
  successMessage = '';

  oilTypes: BaseType[] = [];
  oilVarieties: BaseType[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly labelService: LabelService,
    private readonly genericTypeService: GenericTypeService,
    private readonly productionTraceabilityService: ProductionTraceabilityService,
    private readonly certificationService: CertificationService,
    private readonly companyProfileService: CompanyProfileService,
    private readonly dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loading = true;
    this.loadingTypes = true;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin({
      oilTypes: this.genericTypeService.getAllTypes(TypeCategory.OIL_TYPE),
      oilVarieties: this.genericTypeService.getAllTypes(TypeCategory.OLIVE_VARIETY),
      availableCertifications: this.certificationService.getAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ oilTypes, oilVarieties, availableCertifications }) => {
          this.oilTypes = oilTypes?.data || [];
          this.oilVarieties = oilVarieties?.data || [];
          this.availableCertifications = (availableCertifications || []).filter((cert) => cert.isActive);
          this.loadingTypes = false;
          this.loadCompanyBrand();
          this.loadLabel();
        },
        error: (error) => {
          this.loadingTypes = false;
          this.loading = false;
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Impossible de charger les types huile et les variétés.'
          );
        }
      });
  }

  loadLabel(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      this.errorMessage = 'Identifiant etiquette absent.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.labelService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (label) => {
          this.label = label;
          this.loading = false;
          this.loadCurrentGenealogy(label);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Impossible de charger le detail de cette etiquette.'
          );
        }
      });
  }

  private loadCurrentGenealogy(label: LabelContentDto): void {
    const genealogyId = label.traceabilityLotId || label.lotId;
    if (!genealogyId) {
      this.currentGenealogy = null;
      return;
    }

    this.productionTraceabilityService.getGenealogy(genealogyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (genealogy) => {
          this.currentGenealogy = genealogy;
        },
        error: () => {
          this.currentGenealogy = null;
        }
      });
  }

  getVarietyLabel(value: unknown): string {
    return this.resolveBaseTypeLabel(value, this.oilVarieties);
  }

  getQualityGradeLabel(value: unknown): string {
    return resolveQualityGradeLabel(typeof value === 'string' ? value : String(value ?? ''));
  }

  previewViewModel(): LabelPreviewViewModel {
    return buildLabelPreviewFromDto(this.buildPreviewOptions(this.label!)).viewModel;
  }

  previewPayload(): string {
    if (!this.label) {
      return '';
    }

    if (this.label.finalPayloadJson) {
      return formatLabelPayloadJson(this.label.finalPayloadJson);
    }

    return formatLabelPayloadJson(buildLabelPreviewFromDto(this.buildPreviewOptions(this.label)).payload);
  }

  openPreviewDialog(): void {
    if (!this.label) {
      return;
    }

    const data: LabelPreviewDialogData = {
      viewModel: this.previewViewModel(),
      payloadJson: this.previewPayload()
    };

    this.dialog.open(LabelPreviewDialogComponent, {
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '95vh',
      panelClass: 'label-preview-dialog-panel',
      data
    });
  }

  resolveClaimLabel(claimValue: string): string {
    return this.claimTypeOptions.find((option) => option.value === claimValue)?.label ?? claimValue;
  }

  private buildPreviewOptions(label: LabelContentDto) {
    return {
      label,
      certifications: this.availableCertifications,
      brandName: this.companyProfile?.legalName,
      brandLogoData: this.companyProfile?.logoData,
      brandLogoContentType: this.companyProfile?.logoContentType,
      postFiltrationQualityControls: this.postFiltrationQualityControls,
      genealogy: this.filteredLotGenealogy,
      productDensity: null,
      languageDisplay: this.languageLabel(label.language),
      categoryDisplay: this.categoryLabel(label.labelCategory || 'UNIT'),
      resolveQualityLabel: (value: string | null | undefined) => this.getQualityGradeLabel(value),
      resolveVarietyLabel: (value: string | null | undefined) => this.getVarietyLabel(value),
      resolveClaimLabel: (value: LabelClaimType | string) => this.resolveClaimLabel(String(value))
    };
  }

  private loadCompanyBrand(): void {
    const cachedProfile = this.companyProfileService.getProfileFromCache();
    if (cachedProfile) {
      this.companyProfile = cachedProfile;
    }

    this.companyProfileService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.companyProfile = profile;
        }
      });
  }

  private resolveBaseTypeLabel(value: unknown, source: BaseType[]): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (typeof value === 'object') {
      const objectValue = value as Partial<BaseType> & {
        name?: string;
        label?: string;
        value?: string;
        code?: string;
        libelle?: string;
        designation?: string;
      };

      return (
        objectValue.name ||
        objectValue.label ||
        objectValue.libelle ||
        objectValue.designation ||
        objectValue.value ||
        objectValue.code ||
        '-'
      );
    }

    const textValue = String(value);

    const found = source.find((item) => {
      const typedItem = item as BaseType & {
        name?: string;
        label?: string;
        value?: string;
        code?: string;
        libelle?: string;
        designation?: string;
      };

      return (
        String(typedItem.id) === textValue ||
        typedItem.code === textValue ||
        typedItem.name === textValue ||
        typedItem.label === textValue ||
        typedItem.libelle === textValue ||
        typedItem.designation === textValue ||
        typedItem.value === textValue
      );
    });

    if (!found) {
      return textValue;
    }

    const typedFound = found as BaseType & {
      name?: string;
      label?: string;
      value?: string;
      code?: string;
      libelle?: string;
      designation?: string;
    };

    return (
      typedFound.name ||
      typedFound.label ||
      typedFound.libelle ||
      typedFound.designation ||
      typedFound.value ||
      typedFound.code ||
      textValue
    );
  }

  isFinalized(): boolean {
    return this.label?.status === 'FINALIZED' || this.label?.status === 'EXPORTED_JSON';
  }

  edit(): void {
    if (this.label?.id) {
      this.router.navigate(['/labels', this.label.id, 'edit']);
    }
  }

  unlock(): void {
    if (
      !this.label?.id ||
      !confirm('Êtes-vous sûr de vouloir déverrouiller cette étiquette ? Elle repassera en mode édition.')
    ) {
      return;
    }

    this.unlocking = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.labelService.markAsDraft(this.label.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.unlocking = false;
          this.label = updated;
          this.successMessage = 'L\'étiquette a été déverrouillée et est à nouveau éditable.';
        },
        error: (error) => {
          this.unlocking = false;
          this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors du déverrouillage.');
        }
      });
  }

  deleteLabel(): void {
    if (!this.label?.id) {
      return;
    }

    let message = 'Êtes-vous sûr de vouloir supprimer cette étiquette ?';

    if (this.isFinalized()) {
      message = 'ATTENTION : Cette étiquette est FINALISÉE. Sa suppression est fortement déconseillée pour la traçabilité. Voulez-vous vraiment continuer ?';
    }

    if (!confirm(message)) {
      return;
    }

    this.deleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.labelService.delete(this.label.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/labels']);
        },
        error: (error) => {
          this.deleting = false;
          this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors de la suppression.');
        }
      });
  }

  backToList(): void {
    void this.router.navigate(['/labels']);
  }

  exportLabel(): void {
    if (!this.label?.id) {
      return;
    }

    if (this.label.status !== 'FINALIZED' && this.label.status !== 'EXPORTED_JSON') {
      this.errorMessage = 'Seule une etiquette finalisee peut etre exportee.';
      return;
    }

    this.exporting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.labelService.export(this.label.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (labelExport) => {
          this.exporting = false;

          this.downloadJson(
            labelExport.payloadJson ?? '{}',
            String(labelExport.lotNumber || labelExport.labelId || this.label?.id || 'etiquette')
          );

          if (this.label) {
            this.label = {
              ...this.label,
              status: 'EXPORTED_JSON',
              finalPayloadJson: labelExport.payloadJson ?? '{}',
              finalizedAt: labelExport.finalizedAt,
              finalizedBy: labelExport.finalizedBy
            } as LabelContentDto;
          }

          this.successMessage = 'JSON etiquette exporte avec succes.';
        },
        error: (error) => {
          this.exporting = false;
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Erreur lors de l export de l etiquette.'
          );
        }
      });
  }

  statusLabel(status: LabelContentStatus | undefined): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'VALIDATED':
        return 'Validée';
      case 'FINALIZED':
        return 'Finalisée';
      case 'EXPORTED_JSON':
        return 'Exportée JSON';
      default:
        return '-';
    }
  }

  categoryLabel(category: LabelCategory | string | undefined): string {
    if (!category) return 'Unite';
    switch (category) {
      case 'UNIT':
        return 'Unité';
      case 'COLIS':
        return 'Colis';
      case 'PALLET':
        return 'Palette';
      default:
        return String(category);
    }
  }

  languageLabel(lang: string | undefined): string {
    if (!lang) return '-';
    switch (lang) {
      case 'FR':
        return 'Français';
      case 'EN':
        return 'Anglais';
      case 'AR':
        return 'Arabe';
      default:
        return lang;
    }
  }

  statusClass(status: LabelContentStatus | undefined): string {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'VALIDATED':
        return 'validated';
      case 'FINALIZED':
        return 'finalized';
      case 'EXPORTED_JSON':
        return 'exported';
      default:
        return 'unknown';
    }
  }

  canExport(): boolean {
    return this.label?.status === 'FINALIZED' || this.label?.status === 'EXPORTED_JSON';
  }

  getInitials(name: string | undefined): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getIssueColor(issue: LabelValidationIssueDto): string {
    if (issue.blocking) return '#ef4444';
    if (issue.message.toLowerCase().includes('attention') || issue.message.toLowerCase().includes('manquant')) return '#f97316';
    return '#3b82f6';
  }

  getIssueBadgeLabel(issue: LabelValidationIssueDto): string {
    if (issue.blocking) return 'BLOQUANT';
    if (issue.message.toLowerCase().includes('attention') || issue.message.toLowerCase().includes('manquant')) return 'ATTENTION';
    return 'INFORMATION';
  }

  getIssueBadgeClass(issue: LabelValidationIssueDto): string {
    if (issue.blocking) return 'blocking';
    if (issue.message.toLowerCase().includes('attention') || issue.message.toLowerCase().includes('manquant')) return 'attention';
    return 'info';
  }

  get formattedJson(): string {
    const json = this.label?.finalPayloadJson;

    if (!json) {
      return '';
    }

    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return json;
    }
  }

  get filteredLotSnapshot(): Record<string, unknown> | null {
    return this.parseSnapshot(
      this.label?.sourceSnapshots?.find((snapshot) => snapshot.sourceType === 'FILTERED_LOT')?.snapshotJson
    );
  }

  get filteredLotGenealogy(): ProductionGenealogy | null {
    if (this.currentGenealogy) {
      return this.currentGenealogy;
    }

    const genealogy = this.filteredLotSnapshot?.['genealogy'];
    return genealogy && typeof genealogy === 'object' ? genealogy as ProductionGenealogy : null;
  }

  get rootSource(): ProductionRootSource | null {
    return this.filteredLotGenealogy?.rootSources?.[0] || null;
  }

  get traceabilityAnchor(): string {
    return this.label?.traceabilityLotId || this.label?.lotId ? 'Verifiee' : '-';
  }

  get packagingDisplayLabel(): string {
    if (!this.label?.packagingId && !this.label?.productId) {
      return '-';
    }

    return this.label?.netQuantity
      ? `Packaging lie - ${this.label.netQuantity}`
      : 'Packaging lie';
  }

  get certificationsLabel(): string {
    const certifications = this.label?.certifications?.filter((value) => String(value || '').trim());
    return certifications?.length ? certifications.join(', ') : '-';
  }

  get extractionMethodLabel(): string {
    const value = String(this.label?.extractionMethod || '').trim();
    return value.length >= 3 ? value : '-';
  }

  get sourceProofCount(): number {
    return this.label?.sourceSnapshots?.length || 0;
  }

  get sourceProofLabel(): string {
    const count = this.sourceProofCount;
    if (count <= 0) {
      return '-';
    }
    return `${count} preuve${count > 1 ? 's' : ''} enregistree${count > 1 ? 's' : ''}`;
  }

  get filteredLotStorageName(): string {
    const snapshot = this.filteredLotSnapshot;
    return String(snapshot?.['storageUnitName'] || this.filteredLotGenealogy?.storageUnitName || '-');
  }

  get hasFilteredLotStorageName(): boolean {
    return this.filteredLotStorageName !== '-';
  }

  get filteredLotRootReceptionId(): string {
    return this.rootSource?.lotNumber || this.rootSource?.supplierName || '-';
  }

  get hasOriginIdentity(): boolean {
    return !!(this.rootSource?.lotNumber || this.rootSource?.supplierName || this.filteredLotGenealogy?.traceabilitySourceType);
  }

  get originSourceLabel(): string {
    return this.filteredLotGenealogy?.traceabilitySourceType || this.rootSource?.type || '-';
  }

  get originLotLabel(): string {
    return this.rootSource?.lotNumber || '-';
  }

  get postFiltrationQualityControls(): Record<string, string> {
    return resolvePostFiltrationQualityControls(
      this.filteredLotGenealogy,
      this.label,
      null
    );
  }

  get nonCompositionPostFiltrationQualityControls(): Record<string, string> {
    return filterNonCompositionQualityControls(this.postFiltrationQualityControls);
  }

  get storageConditionsDisplay(): string {
    return resolveStorageConditionsDisplay(this.label?.storageConditions);
  }

  get sensoryProfileDisplay(): string {
    return resolveSensoryProfileDisplay(this.postFiltrationQualityControls, this.label?.sensoryProfile);
  }

  get sensoryFromQualityControl(): boolean {
    return hasSensoryQualityControls(this.postFiltrationQualityControls);
  }

  private parseSnapshot(snapshotJson: string | undefined): Record<string, unknown> | null {
    if (!snapshotJson) {
      return null;
    }

    try {
      const parsed = JSON.parse(snapshotJson);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }

  private downloadJson(payloadJson: string, name: string): void {
    const safeName = name || 'etiquette';
    const fileName = `label-${safeName}.json`;

    const blob = new Blob([payloadJson || '{}'], {
      type: 'application/json;charset=utf-8'
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    window.URL.revokeObjectURL(url);
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    const genericMessage = (error as { message?: string })?.message;

    return apiMessage || genericMessage || fallback;
  }
}
