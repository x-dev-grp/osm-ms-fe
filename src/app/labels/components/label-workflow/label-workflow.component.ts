import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {forkJoin, Observable, of} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {
  LabelContent, LabelExport, LabelGenerateRequest, LabelLanguage, LabelCategory
} from '../../models/label.model';
import {LabelService} from '../../services/label.service';
import {StorageUnitDto} from '../../../shared/models/StorageUnitDto';
import {StorageUnitDtoService} from '../../../shared/services/storage.service';
import {SKU} from '../../../stock/models/sku.model';
import {SKUService} from '../../../stock/services/sku.service';
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'app-label-workflow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './label-workflow.component.html',
  styleUrls: ['./label-workflow.component.scss']
})
export class LabelWorkflowComponent implements OnInit {
  readonly languages: LabelLanguage[] = ['FR', 'EN', 'AR'];

  readonly labelForm = this.fb.group({
    lotId: ['', Validators.required],
    packagingId: ['', Validators.required],
    packagingDate: [this.formatDateInput(new Date()), Validators.required],
    language: ['FR' as LabelLanguage, Validators.required],
    labelCategory: ['UNIT' as LabelCategory, Validators.required],
    legalDenomination: [''],
    storageConditions: [''],
    sensoryProfile: ['']
  });

  filteredLots: StorageUnitDto[] = [];
  packagingOptions: SKU[] = [];

  currentLabel: LabelContent | null = null;
  exportedLabel: LabelExport | null = null;

  loadingLookups = true; //indicateur de chargement
  loadingLabel = false;
  generating = false;
  saving = false;
  validating = false;
  finalizing = false;
  exporting = false;

  errorMessage = '';
  successMessage = '';

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly labelService: LabelService, private readonly storageUnitService: StorageUnitDtoService, private readonly skuService: SKUService) {
  }

  ngOnInit(): void {
    this.loadLotsAndPackaging();
    this.saving = false;
    this.validating = false;
    this.finalizing = false;
    this.exporting = false;
  }

  hasGeneratedLabel(): boolean {
    return !!this.currentLabel?.id;
  }

  isFinalized(): boolean {
    return this.currentLabel?.status === 'FINALIZED';
  }

  blockingIssues() {
    return (this.currentLabel?.validationIssues ?? []).filter((issue) => issue.blocking);
  }

  previewPayload(): string {
    if (this.exportedLabel?.payloadJson) {
      return this.exportedLabel.payloadJson; // plus de formatage
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
      //lancer http
      storageResponse: this.storageUnitService.getAllStorageUnit(), packagingOptions: this.skuService.getActiveSKUs()
    }).subscribe({
      next: ({storageResponse, packagingOptions}) => {
        //trait lot
        const storageUnits = this.normalizeArray<StorageUnitDto>((storageResponse as { data?: unknown }).data)
          .filter((unit) => unit?.id);
        this.filteredLots = storageUnits
          .filter((unit) => unit.filteredOil)
          .sort((left, right) => (left.lotNumber || '').localeCompare(right.lotNumber || ''));
        //trait emballage
        this.packagingOptions = [...(packagingOptions ?? [])]
          .filter((sku) => sku?.id)
          .sort((left, right) => left.code.localeCompare(right.code));
        this.loadingLookups = false;
        this.initFromRoute();
      }, error: (error) => {
        this.loadingLookups = false;
        this.errorMessage = this.resolveErrorMessage(error, 'Impossible de charger les donnees necessaires a la generation des etiquettes.');
      }
    });
  }

  generateLabel(): void {
    if (this.labelForm.invalid) {
      this.labelForm.markAllAsTouched();
      return;
    }

    const request: LabelGenerateRequest = {
      lotId: this.labelForm.value.lotId ?? '',
      packagingId: this.labelForm.value.packagingId ?? '',
      packagingDate: this.labelForm.value.packagingDate ?? undefined,
      language: (this.labelForm.value.language as LabelLanguage | null) ?? 'FR',
      labelCategory: (this.labelForm.value.labelCategory as LabelCategory | null) ?? 'UNIT'
    };


    this.generating = true;
    this.clearMessages();
    this.exportedLabel = null;

    this.labelService.generate(request).subscribe({//
      next: (label) => {

        this.generating = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Le draft etiquette a ete genere avec succes.';
      }, error: (error) => {
        this.generating = false;
        this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors de la generation de l etiquette.');
      }
    });
  }

  //sauv les modif sur une eyiquette non finaliser
  saveDraftChanges(): void {
    if (!this.currentLabel?.id || this.isFinalized()) {
      return;
    }

    this.saving = true;
    this.clearMessages();
    this.exportedLabel = null;

    this.labelService
      .update(this.currentLabel.id, {
        language: (this.labelForm.value.language as LabelLanguage | null) ?? undefined,
        packagingDate: this.labelForm.value.packagingDate ?? undefined,
        legalDenomination: this.labelForm.value.legalDenomination?.trim() || undefined,
        storageConditions: this.labelForm.value.storageConditions?.trim() || undefined,
        sensoryProfile: this.labelForm.value.sensoryProfile?.trim() || undefined
      })
      .subscribe({
        next: (label) => {
          this.saving = false;
          this.syncFormWithLabel(label);
          this.successMessage = 'Le draft etiquette a ete mis a jour.';
        }, error: (error) => {
          this.saving = false;
          this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors de la mise a jour du draft etiquette.');
        }
      });
  }

  validateLabel(): void {
    if (!this.currentLabel?.id) { //valider si etiquette existe
      return;
    }

    this.validating = true;
    this.clearMessages();

    this.saveChanges().pipe(switchMap(() => this.labelService.validate(this.currentLabel!.id!))).subscribe({
      next: (label) => {
        this.validating = false;
        this.syncFormWithLabel(label);

        this.successMessage = label.validationIssues.length ? 'Validation effectuee avec incoherences a corriger.' : 'Le contenu etiquette est valide.';
      }, error: (error) => {
        this.validating = false;
        this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors de la validation de l etiquette.');
      }
    });
  }

  finalizeLabel(): void {
    if (!this.currentLabel?.id || this.blockingIssues().length > 0) {
      return;
    }

    this.finalizing = true;
    this.clearMessages();

    this.saveChanges()
      .pipe(switchMap(() => this.labelService.finalize(this.currentLabel!.id!)))
      .subscribe({
        next: (label) => {
          this.finalizing = false;
          this.syncFormWithLabel(label);
          this.successMessage = 'Le contenu etiquette a ete finalise et fige.';
        },
        error: (error) => {
          this.finalizing = false;
          this.errorMessage = this.resolveErrorMessage(
            error,
            'Erreur lors de la finalisation de l etiquette.'
          );
        }
      });
  }
  //demande au backend le json
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
      }, error: (error) => {
        this.exporting = false;
        this.errorMessage = this.resolveErrorMessage(error, 'Erreur lors de l export de l etiquette.');
      }
    });
  }

  clearAndRestart(): void {
    this.currentLabel = null;
    this.exportedLabel = null;
    this.labelForm.reset({
      lotId: '',
      packagingId: '',
      packagingDate: this.formatDateInput(new Date()),
      language: 'FR',
      labelCategory: 'UNIT',
      legalDenomination: '',
      storageConditions: '',
      sensoryProfile: ''
    });
    this.clearMessages();
    this.router.navigate(['/labels']);
  }

  selectedLotLabel(): string {
    const selectedLot = this.filteredLots.find((lot) => lot.id === this.labelForm.value.lotId);
    return selectedLot ? this.storageUnitLabel(selectedLot) : '-';
  }

  selectedPackagingLabel(): string {
    const selectedPackaging = this.packagingOptions.find((sku) => sku.id === this.labelForm.value.packagingId);
    return selectedPackaging ? this.skuLabel(selectedPackaging) : '-';
  }

  storageUnitLabel(unit: StorageUnitDto): string {
    const parts = [unit.lotNumber, unit.qualityGrade, unit.oilVariety?.name].filter(Boolean);
    return parts.join(' | ');
  }

  skuLabel(sku: SKU): string {
    const volume = sku.volume ? `${sku.volume} ml` : 'volume inconnu';
    return `${sku.code} | ${volume}`;
  }

  trackById(_: number, item: { id?: string }): string {
    return item.id ?? `${_}`;
  }

  //sauv les modif di necessaire
  private saveChanges(): Observable<LabelContent> {
    if (!this.currentLabel?.id || this.isFinalized() || !this.labelForm.dirty) {
      return of(this.currentLabel as LabelContent);
    }

    return this.labelService.update(this.currentLabel.id, {
      language: (this.labelForm.value.language as LabelLanguage | null) ?? undefined,
      packagingDate: this.labelForm.value.packagingDate ?? undefined,
      legalDenomination: this.labelForm.value.legalDenomination?.trim() || undefined,
      storageConditions: this.labelForm.value.storageConditions?.trim() || undefined,
      sensoryProfile: this.labelForm.value.sensoryProfile?.trim() || undefined
    });
  }

  private initFromRoute(): void {
    const labelId = this.route.snapshot.paramMap.get('id');
    if (labelId) {
      this.fetchLabelId(labelId);
      return;
    }

    this.FromUrl();
  }

  //prens les info dans l'adresse web et les pose dans le formulaire
  private FromUrl(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.labelForm.patchValue({
      lotId: queryParams.get('lotId') ?? this.labelForm.value.lotId ?? '',
      packagingId: queryParams.get('packagingId') ?? this.labelForm.value.packagingId ?? '',
      packagingDate: queryParams.get('packagingDate') ?? this.labelForm.value.packagingDate ?? this.formatDateInput(new Date()),
      language: ((queryParams.get('language') as LabelLanguage | null) ?? this.labelForm.value.language ?? 'FR') as LabelLanguage
    });
  }

  //charge une etiquette existante
  private fetchLabelId(labelId: string): void {
    this.loadingLabel = true;
    this.clearMessages();

    this.labelService.getById(labelId).subscribe({
      next: (label) => {
        this.loadingLabel = false;
        this.syncFormWithLabel(label);
        this.successMessage = 'Etiquette chargee avec succes.';
      }, error: (error) => {
        this.loadingLabel = false;
        this.errorMessage = this.resolveErrorMessage(error, 'Impossible de charger cette etiquette.');
      }
    });
  }

  // efface les anciens messages d'erreur/succ
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }


  // prend une Etiquette reCue du serveur et la COLLER  dans le formulaire
  private syncFormWithLabel(label: LabelContent): void {
    this.currentLabel = label;
    this.labelForm.patchValue({
      lotId: label.lotId ?? this.labelForm.value.lotId ?? '',
      packagingId: label.packagingId ?? this.labelForm.value.packagingId ?? '',
      packagingDate: label.packagingDate ?? this.labelForm.value.packagingDate ?? this.formatDateInput(new Date()),
      language: label.language ?? 'FR',
      labelCategory: label.labelCategory ?? 'UNIT',
      legalDenomination: label.legalDenomination ?? '',
      storageConditions: label.storageConditions ?? '',
      sensoryProfile: label.sensoryProfile ?? ''
    });
    this.labelForm.markAsPristine();

    if (label.id && this.route.snapshot.paramMap.get('id') !== label.id) {
      this.router.navigate(['/labels', label.id], {replaceUrl: true});
    }
  }

  //Un Blob est un objet qui contient des données (ici du texte JSON)
  // et qui permet de les manipuler comme un fichier,
  // notamment pour déclencher un téléchargement.
  private downloadJson(labelExport: LabelExport): void {
    const fileName = `label-${labelExport.lotNumber || labelExport.labelId}.json`;
    const blob = new Blob([labelExport.payloadJson], {type: 'application/json;charset=utf-8'});
    const url = window.URL.createObjectURL(blob); //temp url
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }


  private normalizeArray<T>(value: unknown): T[] {
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


