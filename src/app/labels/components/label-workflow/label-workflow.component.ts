import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  LabelCategory,
  LabelClaimType,
  LabelContentDto,
  LabelContentUpdateRequestDto,
  LabelExportDto,
  LabelGenerateRequestDto,
  LabelLanguage,
  LabelQualityGrade,
  LabelValidationIssueDto
} from '../../models/label.model';

import { LabelService } from '../../services/label.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { SKU } from '../../../stock/models/sku.model';
import { SKUService } from '../../../stock/services/sku.service';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';

import { BaseType } from '../../../shared/models/base-type';
import { GenericTypeService } from '../../../shared/services/generic-type.service';
import { TypeCategory } from '../../../shared/models/type-category.enum';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-label-workflow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './label-workflow.component.html',
  styleUrls: ['./label-workflow.component.scss']
})
export class LabelWorkflowComponent implements OnInit {
  readonly languages: LabelLanguage[] = ['FR', 'EN', 'AR'];

  readonly claimTypeOptions: { value: LabelClaimType; label: string }[] = [
    { value: 'MADE_IN_TUNISIA', label: 'Produit de Tunisie' },
    { value: 'BIO', label: 'Agriculture Biologique' },
    { value: 'COLD_EXTRACTION', label: 'Extraction à froid' },
    { value: 'PRIVATE_LABEL', label: 'Marque Privée' },
    { value: 'OTHER', label: 'Autre' }
  ];

  readonly qualityGradeOptions: { value: LabelQualityGrade; label: string }[] = [
    { value: 'EXTRA_VIRGIN', label: 'Huile d’olive vierge extra' },
    { value: 'VIRGIN', label: 'Huile d’olive vierge' },
    { value: 'ORDINARY_VIRGIN', label: 'Huile d’olive vierge courante' },
    { value: 'LAMPANTE', label: 'Huile d’olive lampante' },
    { value: 'REFINED', label: 'Huile d’olive raffinée' },
    { value: 'OLIVE_OIL', label: 'Huile d’olive' },
    { value: 'POMACE_OIL', label: 'Huile de grignons d’olive' }
  ];

  readonly labelForm = this.fb.group({
    lotId: ['', Validators.required],
    packagingId: ['', Validators.required],
    packagingDate: [this.formatDateInput(new Date()), Validators.required],
    language: ['FR' as LabelLanguage, Validators.required],
    labelCategory: ['UNIT' as LabelCategory, Validators.required],

    qualityGrade: ['' as LabelQualityGrade | ''],
    variety: [''],

    legalDenomination: [''],
    certifications: [[] as string[]],
    claimTypes: [[] as LabelClaimType[]],
    storageConditions: [''],
    sensoryProfile: [''],
    lotNumber: [''],
    originCountry: [''],
    netQuantity: [''],
    responsibleName: [''],
    responsibleAddress: [''],
    extractionMethod: [''],
    bestBeforeDate: ['']
  });

  filteredLots: StorageUnitDto[] = [];
  packagingOptions: SKU[] = [];
  availableCertifications: Certification[] = [];
  oilVarieties: BaseType[] = [];

  currentLabel: LabelContentDto | null = null;
  exportedLabel: LabelExportDto | null = null;

  loadingLookups = true;
  loadingLabel = false;
  generating = false;
  saving = false;
  validating = false;
  drafting = false;
  finalizing = false;
  exporting = false;

  draftSavedRecently = false;
  finalizedRecently = false;

  private draftSavedTimer: ReturnType<typeof setTimeout> | null = null;
  private finalizedTimer: ReturnType<typeof setTimeout> | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly labelService: LabelService,
    private readonly storageUnitService: StorageUnitDtoService,
    private readonly skuService: SKUService,
    private readonly certificationService: CertificationService,
    private readonly genericTypeService: GenericTypeService
  ) {}

  ngOnInit(): void {
    this.loadLotsAndPackaging();
    this.saving = false;
    this.finalizing = false;
    this.exporting = false;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();
  }

  hasGeneratedLabel(): boolean {
    return !!this.currentLabel?.id;
  }

  isFinalized(): boolean {
    return this.currentLabel?.status === 'FINALIZED';
  }

  blockingIssues(): LabelValidationIssueDto[] {
    return (this.currentLabel?.validationIssues || []).filter((i) => i.blocking);
  }

  previewPayload(): string {
    if (this.exportedLabel?.payloadJson) {
      return this.exportedLabel.payloadJson;
    }

    if (this.currentLabel?.finalPayloadJson) {
      return this.currentLabel.finalPayloadJson;
    }

    return '';
  }

  pageBusy(): boolean {
    return this.loadingLookups || this.loadingLabel;
  }

  loadLotsAndPackaging(): void {
    this.loadingLookups = true;
    this.clearMessages();

    forkJoin({
      storageResponse: this.storageUnitService.getAllStorageUnit(),
      packagingOptions: this.skuService.getActiveSKUs(),
      availableCertifications: this.certificationService.getAll(),
      oilVarieties: this.genericTypeService.getAllTypes(TypeCategory.OLIVE_VARIETY)
    }).subscribe({
      next: ({
               storageResponse,
               packagingOptions,
               availableCertifications,
               oilVarieties
             }) => {
        const storageUnits = this.normalizeArray<StorageUnitDto>(
          (storageResponse as { data?: unknown }).data
        ).filter((unit) => unit?.id);

        this.filteredLots = storageUnits
          .filter((unit) => unit.filteredOil)
          .sort((left, right) => (left.lotNumber || '').localeCompare(right.lotNumber || ''));

        this.packagingOptions = [...(packagingOptions ?? [])]
          .filter((sku) => sku?.id)
          .sort((left, right) => left.code.localeCompare(right.code));

        this.availableCertifications = (availableCertifications || []).filter((c) => c.isActive);
        this.oilVarieties = oilVarieties?.data || [];

        this.loadingLookups = false;
        this.initFromRoute();
      },
      error: (error) => {
        this.loadingLookups = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Impossible de charger les donnees necessaires a la generation des etiquettes.'
        );
      }
    });
  }

  generateLabel(): void {
    if (this.labelForm.invalid) {
      this.labelForm.markAllAsTouched();
      return;
    }

    const formValue = this.labelForm.getRawValue();

    const request: LabelGenerateRequestDto = {
      lotId: formValue.lotId ?? '',
      packagingId: formValue.packagingId ?? '',
      packagingDate: formValue.packagingDate ?? undefined,
      language: formValue.language ?? 'FR',
      labelCategory: formValue.labelCategory ?? 'UNIT',
      qualityGrade: formValue.qualityGrade || undefined,
      variety: formValue.variety?.trim() || undefined
    };

    this.generating = true;
    this.clearMessages();
    this.exportedLabel = null;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelService.generate(request).subscribe({
      next: (label) => {
        this.generating = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Le draft etiquette a ete genere avec succes.';
      },
      error: (error) => {
        this.generating = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de la generation de l etiquette.'
        );
      }
    });
  }

  saveDraftChanges(): void {
    if (!this.currentLabel?.id || this.isFinalized()) {
      return;
    }

    this.saving = true;
    this.clearMessages();
    this.exportedLabel = null;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelService.update(this.currentLabel.id, this.buildUpdateRequest()).subscribe({
      next: (label) => {
        this.saving = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Le draft etiquette a ete mis a jour.';
        this.showDraftSavedIndicator();
      },
      error: (error) => {
        this.saving = false;
        this.resetDraftSavedIndicator();
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors de la mise a jour du draft etiquette.'
        );
      }
    });
  }

  validateLabel(): void {
    if (!this.currentLabel?.id || this.isFinalized()) {
      return;
    }

    this.validating = true;
    this.clearMessages();
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.saveChanges()
      .pipe(switchMap(() => this.labelService.validate(this.currentLabel!.id!)))
      .subscribe({
        next: (label) => {
          this.validating = false;
          this.syncFormWithLabel(label);

          if (this.blockingIssues().length > 0) {
            this.errorMessage = 'L etiquette contient encore des erreurs bloquantes.';
          } else {
            this.successMessage = 'Le contenu etiquette a ete valide avec succes.';
          }
        },
        error: (error) => {
          this.validating = false;
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Erreur lors de la validation de l etiquette.'
          );
        }
      });
  }

  markAsDraft(): void {
    if (!this.currentLabel?.id) {
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir déverrouiller cette étiquette ? Elle repassera en mode brouillon.')) {
      return;
    }

    this.drafting = true;
    this.clearMessages();
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelService.markAsDraft(this.currentLabel.id).subscribe({
      next: (label) => {
        this.drafting = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'L etiquette a ete remise en brouillon.';
      },
      error: (error) => {
        this.drafting = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Erreur lors du retour au statut brouillon.'
        );
      }
    });
  }

  finalizeLabel(): void {
    if (!this.currentLabel?.id || this.blockingIssues().length > 0) {
      return;
    }

    this.finalizing = true;
    this.clearMessages();
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.saveChanges()
      .pipe(switchMap(() => this.labelService.finalize(this.currentLabel!.id!)))
      .subscribe({
        next: (label) => {
          this.finalizing = false;
          this.syncFormWithLabel(label);
          this.successMessage = 'Le contenu etiquette a ete finalise et fige.';
          this.showFinalizedIndicator();
        },
        error: (error) => {
          this.finalizing = false;
          this.resetFinalizedIndicator();
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Erreur lors de la finalisation de l etiquette.'
          );
        }
      });
  }

  exportLabel(): void {
    if (!this.currentLabel?.id) {
      return;
    }

    this.exporting = true;
    this.clearMessages();

    this.labelService.export(this.currentLabel.id).subscribe({
      next: (labelExport) => {
        this.exporting = false;
        this.exportedLabel = labelExport;
        this.downloadJson(labelExport);
        this.successMessage = 'Le JSON etiquette a ete exporte.';
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

  clearAndRestart(): void {
    this.currentLabel = null;
    this.exportedLabel = null;
    this.resetDraftSavedIndicator();
    this.resetFinalizedIndicator();

    this.labelForm.reset({
      lotId: '',
      packagingId: '',
      packagingDate: this.formatDateInput(new Date()),
      language: 'FR',
      labelCategory: 'UNIT',
      qualityGrade: '',
      variety: '',
      legalDenomination: '',
      certifications: [],
      claimTypes: [],
      storageConditions: '',
      sensoryProfile: '',
      lotNumber: '',
      originCountry: '',
      netQuantity: '',
      responsibleName: '',
      responsibleAddress: '',
      extractionMethod: '',
      bestBeforeDate: ''
    });

    this.clearMessages();
    this.router.navigate(['/labels']);
  }

  selectedLotLabel(): string {
    const selectedLot = this.filteredLots.find((lot) => lot.id === this.labelForm.value.lotId);
    return selectedLot ? this.storageUnitLabel(selectedLot) : '-';
  }

  selectedPackagingLabel(): string {
    const selectedPackaging = this.packagingOptions.find(
      (sku) => sku.id === this.labelForm.value.packagingId
    );

    return selectedPackaging ? this.skuLabel(selectedPackaging) : '-';
  }

  get selectedCertifications(): Certification[] {
    const selectedNames = this.labelForm.get('certifications')?.value || [];
    return this.availableCertifications.filter((c) => selectedNames.includes(c.name));
  }

  resolveClaimLabel(claimValue: string): string {
    return this.claimTypeOptions.find((o) => o.value === claimValue)?.label ?? claimValue;
  }

  resolveQualityLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return this.qualityGradeOptions.find((option) => option.value === value)?.label ?? value;
  }

  resolveVarietyLabel(value: string | null | undefined): string {
    return this.resolveBaseTypeLabel(value, this.oilVarieties);
  }

  baseTypeLabel(type: BaseType): string {
    const item = type as unknown as {
      id?: string;
      name?: string;
      label?: string;
      value?: string;
      code?: string;
      libelle?: string;
      designation?: string;
    };

    return (
      item.name ||
      item.label ||
      item.libelle ||
      item.designation ||
      item.value ||
      item.code ||
      String(item.id || '')
    );
  }

  baseTypeValue(type: BaseType): string {
    const item = type as unknown as {
      id?: string;
      code?: string;
      value?: string;
      name?: string;
    };

    return item.code || item.value || item.name || String(item.id || '');
  }

  storageUnitLabel(unit: StorageUnitDto): string {
    const parts = [unit.lotNumber, unit.qualityGrade, unit.oilVariety?.name].filter(Boolean);
    return parts.join(' | ');
  }

  skuLabel(sku: SKU): string {
    const volume = sku.volume ? `${sku.volume} ml` : 'volume inconnu';
    return `${sku.code} | ${volume}`;
  }

  trackById(index: number, item: unknown): string {
    const typedItem = item as { id?: string };
    return typedItem?.id ?? `${index}`;
  }

  private saveChanges(): Observable<LabelContentDto> {
    if (!this.currentLabel?.id || this.isFinalized() || !this.labelForm.dirty) {
      return of(this.currentLabel as LabelContentDto);
    }

    return this.labelService.update(this.currentLabel.id, this.buildUpdateRequest());
  }

  private buildUpdateRequest(): LabelContentUpdateRequestDto {
    return {
      language: (this.labelForm.value.language as LabelLanguage | null) ?? undefined,
      packagingDate: this.labelForm.value.packagingDate ?? undefined,

      qualityGrade: this.labelForm.value.qualityGrade || undefined,
      variety: this.labelForm.value.variety?.trim() || undefined,

      legalDenomination: this.labelForm.value.legalDenomination?.trim() || undefined,
      storageConditions: this.labelForm.value.storageConditions?.trim() || undefined,
      sensoryProfile: this.labelForm.value.sensoryProfile?.trim() || undefined,
      certifications: this.normalizeArray(this.labelForm.value.certifications),
      claimTypes: this.normalizeArray(this.labelForm.value.claimTypes),
      lotNumber: this.labelForm.value.lotNumber?.trim() || undefined,
      originCountry: this.labelForm.value.originCountry?.trim() || undefined,
      netQuantity: this.labelForm.value.netQuantity?.trim() || undefined,
      responsibleName: this.labelForm.value.responsibleName?.trim() || undefined,
      responsibleAddress: this.labelForm.value.responsibleAddress?.trim() || undefined,
      extractionMethod: this.labelForm.value.extractionMethod?.trim() || undefined,
      bestBeforeDate: this.labelForm.value.bestBeforeDate?.trim() || undefined
    };
  }

  private initFromRoute(): void {
    const labelId = this.route.snapshot.paramMap.get('id');

    if (labelId) {
      this.fetchLabelId(labelId);
      return;
    }

    this.fromUrl();
  }

  private fromUrl(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const lotId = queryParams.get('lotId');

    if (lotId) {
      this.labelForm.get('lotId')?.setValue(lotId);
      this.labelForm.get('lotId')?.disable();
    }

    this.labelForm.patchValue({
      packagingId: queryParams.get('packagingId') ?? this.labelForm.value.packagingId ?? '',
      packagingDate:
        queryParams.get('packagingDate') ??
        this.labelForm.value.packagingDate ??
        this.formatDateInput(new Date()),
      language: ((queryParams.get('language') as LabelLanguage | null) ??
        this.labelForm.value.language ??
        'FR') as LabelLanguage
    });
  }

  private fetchLabelId(labelId: string): void {
    this.loadingLabel = true;
    this.clearMessages();

    this.labelService.getById(labelId).subscribe({
      next: (label) => {
        this.loadingLabel = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Etiquette chargee avec succes.';
      },
      error: (error) => {
        this.loadingLabel = false;
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Impossible de charger cette etiquette.'
        );
      }
    });
  }

  private syncFormWithLabel(label: LabelContentDto): void {
    this.currentLabel = label;

    this.labelForm.patchValue({
      lotId: label.lotId || '',
      packagingId: label.packagingId || '',
      packagingDate: label.packagingDate || this.formatDateInput(new Date()),
      language: label.language || 'FR',
      labelCategory: label.labelCategory || 'UNIT',

      qualityGrade: (label.qualityGrade as LabelQualityGrade) || '',
      variety: label.variety || '',

      legalDenomination: label.legalDenomination || '',
      storageConditions: label.storageConditions || '',
      sensoryProfile: label.sensoryProfile || '',
      certifications: label.certifications || [],
      claimTypes: label.claimTypes || [],
      lotNumber: label.lotNumber || '',
      originCountry: label.originCountry || '',
      netQuantity: label.netQuantity || '',
      responsibleName: label.responsibleName || '',
      responsibleAddress: label.responsibleAddress || '',
      extractionMethod: label.extractionMethod || '',
      bestBeforeDate: label.bestBeforeDate || ''
    });

    this.labelForm.markAsPristine();

    if (label.id && this.route.snapshot.paramMap.get('id') !== label.id) {
      this.router.navigate(['/labels', label.id], { replaceUrl: true });
    }
  }

  private resolveBaseTypeLabel(value: string | null | undefined, source: BaseType[]): string {
    if (!value) {
      return '-';
    }

    const found = source.find((item) => {
      const typedItem = item as unknown as {
        id?: string;
        code?: string;
        name?: string;
        label?: string;
        value?: string;
        libelle?: string;
        designation?: string;
      };

      return (
        String(typedItem.id) === value ||
        typedItem.code === value ||
        typedItem.name === value ||
        typedItem.label === value ||
        typedItem.value === value ||
        typedItem.libelle === value ||
        typedItem.designation === value
      );
    });

    return found ? this.baseTypeLabel(found) : value;
  }

  private showDraftSavedIndicator(): void {
    this.draftSavedRecently = true;

    if (this.draftSavedTimer) {
      clearTimeout(this.draftSavedTimer);
    }

    this.draftSavedTimer = setTimeout(() => {
      this.draftSavedRecently = false;
      this.draftSavedTimer = null;
    }, 3000);
  }

  private resetDraftSavedIndicator(): void {
    this.draftSavedRecently = false;

    if (this.draftSavedTimer) {
      clearTimeout(this.draftSavedTimer);
      this.draftSavedTimer = null;
    }
  }

  private showFinalizedIndicator(): void {
    this.finalizedRecently = true;

    if (this.finalizedTimer) {
      clearTimeout(this.finalizedTimer);
    }

    this.finalizedTimer = setTimeout(() => {
      this.finalizedRecently = false;
      this.finalizedTimer = null;
    }, 3000);
  }

  private resetFinalizedIndicator(): void {
    this.finalizedRecently = false;

    if (this.finalizedTimer) {
      clearTimeout(this.finalizedTimer);
      this.finalizedTimer = null;
    }
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private downloadJson(labelExport: LabelExportDto): void {
    const fileName = `label-${labelExport.lotNumber || labelExport.labelId}.json`;
    const blob = new Blob([labelExport.payloadJson], {
      type: 'application/json;charset=utf-8'
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    window.URL.revokeObjectURL(url);
  }

  private normalizeArray<T>(value: unknown): T[] {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s) as unknown as T[];
    }

    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((item) => (Array.isArray(item) ? item : [item])) as T[];
  }

  private resolveErrorMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    const genericMessage = (error as { message?: string })?.message;

    return apiMessage || genericMessage || fallback;
  }

  private formatDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
