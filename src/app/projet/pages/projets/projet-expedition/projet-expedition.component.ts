import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProjetDto } from '../../../models/TypeProduit';
import { ProjetService } from '../../../services/projet.service';
import { ExpeditionDto, ExpeditionStatus } from '../../../models/expedition.model';
import { ExpeditionService } from '../../../services/expedition.service';
import { OFService } from '../../../../OF/services/OFService';
import { OrdreFabrication } from '../../../../OF/models/of.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { extractHttpErrorMessage } from '../../../../shared/utils/http-error.util';
import { DocumentGenerationService } from '../../../../shared/services/document-generation.service';
import { TraceabilityTimelineComponent } from '../../../../shared/components/traceability-timeline/traceability-timeline.component';
import { TranslateModule } from '@ngx-translate/core';
import {
  countGenealogyLots,
  countOfDetails,
  countPackagedLabels
} from '../../../../shared/utils/traceability-snapshot.util';

@Component({
  selector: 'app-projet-expedition',
  standalone: true,
  imports: [TranslateModule,
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    TraceabilityTimelineComponent
  ],
  templateUrl: './projet-expedition.component.html',
  styleUrls: ['./projet-expedition.component.scss']
})
export class ProjetExpeditionComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  readonly statusValues: ExpeditionStatus[] = Object.values(ExpeditionStatus);

  projectId: string | null = null;
  project: ProjetDto | null = null;
  projectOfs: OrdreFabrication[] = [];

  expeditions: ExpeditionDto[] = [];
  selectedExpedition: ExpeditionDto | null = null;
  queryExpeditionId: string | null = null;
  private openTraceabilityOnLoad = false;

  loading = false;
  saving = false;
  creating = false;
  addingLine = false;
  actionLoading = false;
  showTraceability = false;
  traceabilityLoading = false;
  expeditionTraceabilityData: Record<string, unknown> | null = null;
  showCreateForm = false;
  showAddLine = false;
  showDetail = false;

  readonly createForm = this.fb.group({
    destination: [''],
    plannedShipDate: [''],
    notes: ['']
  });

  readonly createLinesForm = this.fb.group({
    lines: this.fb.array([])
  });

  readonly editForm = this.fb.group({
    destination: [''],
    plannedShipDate: [''],
    notes: [''],
    carrierName: [''],
    driverName: [''],
    truckNumber: [''],
    trackingNumber: [''],
    incoterm: ['']
  });

  readonly lineForm = this.fb.group({
    ofId: ['', Validators.required],
    articleId: [''],
    quantity: [1, [Validators.required, Validators.min(1)]],
    volume: [null as number | null],
    lotNumber: [''],
    unit: ['UNIT']
  });

  readonly actionForm = this.fb.group({
    comment: ['']
  });

  readonly searchForm = this.fb.group({
    code: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private projetService: ProjetService,
    private expeditionService: ExpeditionService,
    private ofService: OFService,
    private toast: ToastService,
    private documentGenerationService: DocumentGenerationService
  ) {}

  getParsedSnapshot(exp: ExpeditionDto): any {
    if (!exp.traceabilitySnapshotJson) return null;
    try {
      return JSON.parse(exp.traceabilitySnapshotJson);
    } catch (e) {
      console.error('Error parsing traceability snapshot', e);
      return null;
    }
  }

  get createLineControls(): FormArray {
    return this.createLinesForm.get('lines') as FormArray;
  }

  get selectedCreateLineCount(): number {
    return this.createLineControls.controls.filter(control => control.value.selected).length;
  }

  get selectedCreateLineQuantity(): number {
    return this.createLineControls.controls
      .filter(control => control.value.selected)
      .reduce((sum, control) => sum + Number(control.value.quantity || 0), 0);
  }

  get projectTargetQuantity(): number {
    return Number(this.project?.quantiteCible || 0);
  }

  get usedProjectQuantity(): number {
    return this.allocatedProjectQuantity;
  }

  get allocatedProjectQuantity(): number {
    return this.expeditions
      .filter((exp) => exp.status !== ExpeditionStatus.CANCELLED)
      .reduce((sum, exp) => sum + Number(exp.totalQuantity || 0), 0);
  }

  get deliveredProjectQuantity(): number {
    return this.expeditions
      .filter((exp) => exp.status === ExpeditionStatus.DELIVERED || exp.status === ExpeditionStatus.CLOSED)
      .reduce((sum, exp) => sum + Number(exp.totalQuantity || 0), 0);
  }

  get remainingProjectQuantity(): number {
    return Math.max(0, this.projectTargetQuantity - this.allocatedProjectQuantity);
  }

  get projectDeliveryComplete(): boolean {
    if (this.isCompletedProjectStatus(this.project?.statut)) {
      return true;
    }

    return this.projectTargetQuantity > 0 && this.deliveredProjectQuantity >= this.projectTargetQuantity;
  }

  hasFrozenTraceability(exp: ExpeditionDto | null): boolean {
    return !!exp?.traceabilitySnapshotJson?.trim();
  }

  isTraceabilityFrozen(exp: ExpeditionDto | null): boolean {
    if (!exp) {
      return false;
    }
    return [
      ExpeditionStatus.VALIDATED,
      ExpeditionStatus.SHIPPED,
      ExpeditionStatus.DELIVERED,
      ExpeditionStatus.CLOSED
    ].includes(exp.status);
  }

  displayTraceabilityData(): Record<string, unknown> | null {
    if (!this.selectedExpedition) {
      return null;
    }
    const frozen = this.getParsedSnapshot(this.selectedExpedition);
    if (frozen) {
      return frozen;
    }
    return this.expeditionTraceabilityData;
  }

  getTraceabilityItems(exp: ExpeditionDto): Array<{ label: string; value: string }> {
    const snapshot = this.getParsedSnapshot(exp) ?? this.expeditionTraceabilityData;
    if (!snapshot || typeof snapshot !== 'object') {
      return [];
    }

    const expeditionMeta = (snapshot['expedition'] as Record<string, unknown>) || {};
    const items: Array<{ label: string; value: string }> = [];
    this.pushTraceabilityItem(
      items,
      'Projet',
      String(expeditionMeta['projectCode'] || snapshot['projectCode'] || exp.projetCode || '')
    );
    this.pushTraceabilityItem(
      items,
      'Expedition',
      String(expeditionMeta['expeditionNumber'] || exp.expeditionNumber || '')
    );
    this.pushTraceabilityItem(
      items,
      'Client',
      String(expeditionMeta['clientName'] || snapshot['clientName'] || this.project?.client.nom || '')
    );
    this.pushTraceabilityItem(items, 'OF', String(countOfDetails(snapshot)));
    this.pushTraceabilityItem(items, 'Lots huile', String(countGenealogyLots(snapshot)));
    this.pushTraceabilityItem(items, 'Etiquettes', String(countPackagedLabels(snapshot)));
    if (snapshot['capturedAt']) {
      this.pushTraceabilityItem(items, 'Figé le', String(snapshot['capturedAt']));
    }

    return items;
  }

  toggleTraceability(): void {
    this.showTraceability = !this.showTraceability;
    if (this.showTraceability) {
      this.loadExpeditionTraceability();
    }
  }

  loadExpeditionTraceability(): void {
    if (!this.selectedExpedition?.id) {
      return;
    }
    if (this.hasFrozenTraceability(this.selectedExpedition)) {
      this.expeditionTraceabilityData = this.getParsedSnapshot(this.selectedExpedition);
      return;
    }

    this.traceabilityLoading = true;
    this.expeditionService.getExpeditionTraceability(this.selectedExpedition.id).subscribe({
      next: (data) => {
        this.expeditionTraceabilityData = data;
        this.traceabilityLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement tracabilite expedition', err);
        this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LA_TRACABILITE_DE_L_EXPEDITION');
        this.traceabilityLoading = false;
      }
    });
  }

  toggleCreateForm() {
    if (!this.canCreateExpedition()) {
      this.showCreateForm = false;
      this.toast.info(this.createExpeditionDisabledMessage());
      return;
    }

    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.applyCreateDefaults();
    }
  }

  toggleAddLine() {
    this.showAddLine = !this.showAddLine;
  }

  generatePDF(exp: ExpeditionDto) {
    if (exp.id) {
      this.documentGenerationService.downloadExpeditionPdf(exp.id);
    }
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (!this.projectId) {
      this.onBack();
      return;
    }

    this.queryExpeditionId = this.route.snapshot.queryParamMap.get('expeditionId');
    this.openTraceabilityOnLoad = this.route.snapshot.queryParamMap.get('traceability') === '1';

    this.loadProject(this.projectId);
    this.loadExpeditions(this.projectId);
    this.loadProjectOfs(this.projectId);
  }

  private loadProject(id: string): void {
    this.projetService.getById(id).subscribe({
      next: (project) => {
        this.project = project;
        this.applyProjectDeliveryCompletion();
        this.applyCreateDefaults();
        this.applyDefaultUnitToCreateLines();
      },
      error: (err) => {
        console.error('Erreur chargement projet', err);
        this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DU_PROJET');
      }
    });
  }

  private loadExpeditions(projectId: string): void {
    this.loading = true;
    this.expeditionService.getByProject(projectId).subscribe({
      next: (items) => {
        this.expeditions = items;
        this.applyProjectDeliveryCompletion();
        this.selectedExpedition = this.queryExpeditionId
          ? items.find(item => item.id === this.queryExpeditionId) ?? null
          : null;
        if (this.selectedExpedition) {
          this.patchEditForm(this.selectedExpedition);
          if (this.openTraceabilityOnLoad) {
            this.showTraceability = true;
            this.loadExpeditionTraceability();
            this.openTraceabilityOnLoad = false;
          }
        }
        if (!this.canCreateExpedition()) {
          this.showCreateForm = false;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement expeditions', err);
        this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DES_EXPEDITIONS');
        this.loading = false;
      }
    });
  }

  private loadProjectOfs(projectId: string): void {
    this.ofService.getByProject(projectId).subscribe({
      next: (data) => {
        this.projectOfs = (data as any)?.data ? (data as any).data : data;
        this.buildCreateLines(this.projectOfs);
      },
      error: (err: any) => console.error('Erreur chargement OFs du projet', err)
    });
  }

  selectExpedition(expedition: ExpeditionDto): void {
    this.selectedExpedition = expedition;
    this.showDetail = true;
    this.showCreateForm = false;
    this.showTraceability = false;
    this.expeditionTraceabilityData = null;
    this.patchEditForm(expedition);
  }

  deselectExpedition(): void {
    this.selectedExpedition = null;
    this.showDetail = false;
  }

  deleteExpedition(exp: ExpeditionDto): void {
    if (!confirm(`Supprimer l'expedition ${exp.expeditionNumber} ?`)) {
      return;
    }

    this.expeditionService.delete(exp.id).subscribe({
      next: () => {
        this.expeditions = this.expeditions.filter(e => e.id !== exp.id);
        if (this.selectedExpedition?.id === exp.id) {
          this.deselectExpedition();
        }
        this.toast.success('AUTO.EXPEDITION_SUPPRIMEE');
      },
      error: (err) => {
        console.error('Erreur suppression expedition', err);
      }
    });
  }

  canDelete(): boolean {
    return this.selectedExpedition?.status === ExpeditionStatus.DRAFT;
  }

  private patchEditForm(expedition: ExpeditionDto): void {
    this.editForm.patchValue({
      destination: expedition.destination ?? '',
      plannedShipDate: expedition.plannedShipDate ?? '',
      notes: expedition.notes ?? '',
      carrierName: expedition.carrierName ?? '',
      driverName: expedition.driverName ?? '',
      truckNumber: expedition.truckNumber ?? '',
      trackingNumber: expedition.trackingNumber ?? '',
      incoterm: expedition.incoterm ?? ''
    });
  }

  onOfSelected(event: Event): void {
    const ofId = (event.target as HTMLSelectElement).value;
    const selectedOf = this.projectOfs.find(o => o.id === ofId);
    if (selectedOf) {
      this.lineForm.patchValue({
        ofId: selectedOf.id,
        articleId: '',
        lotNumber: this.defaultLotNumberForOf(selectedOf),
        unit: this.project?.unite === 'LITRES' ? 'L' : 'UNIT'
      });
    } else {
      this.lineForm.patchValue({ ofId: '', articleId: '', lotNumber: '' });
    }
  }


  getSelectedLineOf(): OrdreFabrication | undefined {
    const selectedOfId = this.lineForm.value.ofId;
    return this.projectOfs.find(of => of.id === selectedOfId);
  }

  createExpedition(): void {
    if (!this.projectId || this.creating) {
      return;
    }

    if (!this.canCreateExpedition()) {
      this.toast.warning(this.createExpeditionDisabledMessage());
      return;
    }

    const selectedLines = this.createLineControls.controls
      .filter(control => control.value.selected)
      .map(control => ({
        ofId: this.trimToUndefined(control.value.ofId),
        quantity: Number(control.value.quantity || 0),
        volume: control.value.volume ?? undefined,
        lotNumber: this.trimToUndefined(control.value.lotNumber),
        unit: this.trimToUndefined(control.value.unit)?.toUpperCase() ?? this.projectUnit()
      }))
      .filter(line => line.ofId && line.quantity > 0);

    if (!selectedLines.length) {
      this.toast.warning('AUTO.SELECTIONNEZ_AU_MOINS_UN_OF_A_EXPEDIER');
      return;
    }

    const totalSelected = selectedLines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    if (totalSelected > this.remainingProjectQuantity) {
      this.toast.warning('AUTO.QUANTITE_DEPASSEE_MAXIMUM_AUTORISE', { value0: this.remainingProjectQuantity });
      return;
    }

    this.creating = true;
    this.expeditionService
      .create({
        projetId: this.projectId,
        destination: this.createForm.value.destination ?? undefined,
        plannedShipDate: this.createForm.value.plannedShipDate ?? undefined,
        notes: this.createForm.value.notes ?? undefined,
        lines: selectedLines
      })
      .subscribe({
        next: (expedition) => {
          this.creating = false;
          this.createForm.reset({ destination: '', plannedShipDate: '', notes: '' });
          this.buildCreateLines(this.projectOfs);
          this.expeditions = [expedition, ...this.expeditions];
          this.applyProjectDeliveryCompletion();
          this.selectExpedition(expedition);
          this.toast.success('AUTO.EXPEDITION_CREEE_AVEC_SUCCES');
        },
        error: (err) => {
          console.error('Erreur creation expedition', err);
          this.toast.error(extractHttpErrorMessage(err, 'AUTO.ERREUR_LORS_DE_LA_CREATION_DE_L_EXPEDITION'));
          this.creating = false;
        }
      });
  }

  saveExpedition(): void {
    if (!this.selectedExpedition?.id || this.saving) {
      return;
    }

    this.saving = true;
    this.expeditionService
      .update(this.selectedExpedition.id, {
        destination: this.editForm.value.destination ?? undefined,
        plannedShipDate: this.editForm.value.plannedShipDate ?? undefined,
        notes: this.editForm.value.notes ?? undefined,
        carrierName: this.editForm.value.carrierName ?? undefined,
        driverName: this.editForm.value.driverName ?? undefined,
        truckNumber: this.editForm.value.truckNumber ?? undefined,
        trackingNumber: this.editForm.value.trackingNumber ?? undefined,
        incoterm: this.editForm.value.incoterm ?? undefined
      })
      .subscribe({
        next: (updated) => {
          this.saving = false;
          this.syncExpedition(updated);
          this.toast.success('AUTO.MODIFICATIONS_ENREGISTREES');
        },
        error: (err) => {
          console.error('Erreur sauvegarde expedition', err);
          this.toast.error('CONTROLE_QUALITE.MESSAGES.ERROR.SAVE');
          this.saving = false;
        }
      });
  }

  addLine(): void {
    if (this.projectDeliveryComplete) {
      this.toast.warning('AUTO.PROJET_DEJA_LIVRE_IMPOSSIBLE_D_AJOUTER_UNE_LIGNE_D_EXPEDITION');
      return;
    }

    if (!this.selectedExpedition?.id || this.addingLine || this.lineForm.invalid) {
      this.lineForm.markAllAsTouched();
      if (this.lineForm.invalid) {
        this.toast.warning('AUTO.VEUILLEZ_SELECTIONNER_UN_OF_ET_SAISIR_UNE_QUANTITE');
      }
      return;
    }

    this.addingLine = true;
    const requestedQty = Number(this.lineForm.value.quantity ?? 0);
    const projected = this.usedProjectQuantity + requestedQty;
    if (projected > this.projectTargetQuantity) {
      this.toast.warning('AUTO.QUANTITE_DEPASSEE_MAXIMUM_RESTANT_PROJET', { value0: this.remainingProjectQuantity });
      this.addingLine = false;
      return;
    }

    this.expeditionService
      .addLine(this.selectedExpedition.id, {
        ofId: this.trimToUndefined(this.lineForm.value.ofId),
        articleId: this.trimToUndefined(this.lineForm.value.articleId),
        quantity: Number(this.lineForm.value.quantity ?? 0),
        volume: this.lineForm.value.volume ?? undefined,
        lotNumber: this.trimToUndefined(this.lineForm.value.lotNumber),
        unit: this.trimToUndefined(this.lineForm.value.unit)?.toUpperCase() ?? 'UNIT'
      })
      .subscribe({
        next: (updated) => {
          this.addingLine = false;
          this.lineForm.reset({
            ofId: '',
            articleId: '',
            quantity: 1,
            volume: null,
            lotNumber: '',
            unit: this.project?.unite === 'LITRES' ? 'L' : 'UNIT'
          });
          this.syncExpedition(updated);
          this.toast.success('AUTO.LIGNE_AJOUTEE');
        },
        error: (err) => {
          console.error('Erreur ajout ligne expedition', err);
          const msg = err.error?.message || 'Erreur lors de l\'ajout de la ligne';
          this.toast.error(msg);
          this.addingLine = false;
        }
      });
  }

  removeLine(lineId: string): void {
    if (!this.selectedExpedition?.id) {
      return;
    }

    if (!confirm(this.i18n.instant('AUTO.SUPPRIMER_CETTE_LIGNE'))) {
      return;
    }

    this.expeditionService.removeLine(this.selectedExpedition.id, lineId).subscribe({
      next: (updated) => {
        this.syncExpedition(updated);
        this.toast.success('AUTO.LIGNE_SUPPRIMEE');
      },
      error: (err) => {
        console.error('Erreur suppression ligne', err);
      }
    });
  }

  doAction(action: 'ready' | 'validate' | 'ship' | 'deliver' | 'close' | 'cancel'): void {
    if (!this.selectedExpedition?.id || this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    const payload = { comment: this.trimToUndefined(this.actionForm.value.comment) };

    const request =
      action === 'ready'
        ? this.expeditionService.ready(this.selectedExpedition.id, payload)
        : action === 'validate'
        ? this.expeditionService.validate(this.selectedExpedition.id, payload)
        : action === 'ship'
        ? this.expeditionService.ship(this.selectedExpedition.id, payload)
        : action === 'deliver'
        ? this.expeditionService.deliver(this.selectedExpedition.id, payload)
        : action === 'close'
        ? this.expeditionService.close(this.selectedExpedition.id, payload)
        : this.expeditionService.cancel(this.selectedExpedition.id, payload);

    request.subscribe({
      next: (updated) => {
        this.actionLoading = false;
        this.actionForm.reset({ comment: '' });
        this.syncExpedition(updated);
        if (action === 'validate') {
          this.showTraceability = true;
          this.loadExpeditionTraceability();
        }
        this.toast.success('AUTO.ACTION_EFFECTUEE', { value0: action.toUpperCase() });
      },
      error: (err) => {
        console.error('Erreur action expedition', err);
        this.actionLoading = false;
      }
    });
  }

  searchByCode(): void {
    const code = this.trimToUndefined(this.searchForm.value.code);
    if (!code) {
      return;
    }

    this.expeditionService.resolve(code).subscribe({
      next: (resolved) => {
        if (!resolved.entityId) {
          this.toast.warning('AUTO.AUCUNE_EXPEDITION_TROUVEE_POUR_CE_CODE');
          return;
        }
        this.expeditionService.getById(resolved.entityId).subscribe({
          next: (expedition) => {
            this.syncExpedition(expedition);
            this.toast.info('AUTO.EXPEDITION_CHARGEE');
          },
          error: (err) => {
            console.error('Erreur chargement expedition resolue', err);
            this.toast.error('AUTO.ERREUR_LORS_DU_CHARGEMENT_DE_L_EXPEDITION_TROUVEE');
          }
        });
      },
      error: (err) => {
        console.error('Erreur resolve expedition', err);
        this.toast.error('AUTO.CODE_INTROUVABLE');
      }
    });
  }

  canAction(action: 'ready' | 'validate' | 'ship' | 'deliver' | 'close' | 'cancel'): boolean {
    const status = this.selectedExpedition?.status;
    if (!status) {
      return false;
    }

    if (action === 'ready') {
      return status === ExpeditionStatus.DRAFT;
    }
    if (action === 'validate') {
      return status === ExpeditionStatus.READY;
    }
    if (action === 'ship') {
      return status === ExpeditionStatus.VALIDATED;
    }
    if (action === 'deliver') {
      return status === ExpeditionStatus.SHIPPED;
    }
    if (action === 'close') {
      return status === ExpeditionStatus.SHIPPED || status === ExpeditionStatus.DELIVERED;
    }
    // cancel
    return (
      status === ExpeditionStatus.DRAFT ||
      status === ExpeditionStatus.READY ||
      status === ExpeditionStatus.VALIDATED
    );
  }

  canCreateExpedition(): boolean {
    return !this.projectDeliveryComplete && this.remainingProjectQuantity > 0;
  }

  createExpeditionDisabledMessage(): string {
    if (this.projectDeliveryComplete) {
      return 'Projet deja livre. Aucune nouvelle expedition n est autorisee.';
    }

    if (this.remainingProjectQuantity <= 0) {
      return 'Quantite projet deja atteinte. Impossible de creer une nouvelle expedition.';
    }

    return '';
  }

  isEditable(): boolean {
    const status = this.selectedExpedition?.status;
    return status === ExpeditionStatus.DRAFT || status === ExpeditionStatus.READY;
  }

  statusLabel(status?: ExpeditionStatus): string {
    if (!status) {
      return '-';
    }
    switch (status) {
      case ExpeditionStatus.DRAFT: return 'Brouillon';
      case ExpeditionStatus.READY: return 'Pret';
      case ExpeditionStatus.VALIDATED: return 'Valide';
      case ExpeditionStatus.SHIPPED: return 'Expedie';
      case ExpeditionStatus.DELIVERED: return 'Livre';
      case ExpeditionStatus.CLOSED: return 'Cloture';
      case ExpeditionStatus.CANCELLED: return 'Annule';
      default: return status;
    }
  }

  statusClass(status?: ExpeditionStatus): string {
    if (!status) return '';
    return 'status-' + status.toLowerCase();
  }

  getQrImage(expedition: ExpeditionDto): string {
    if (!expedition.qrImageBase64) {
      return '';
    }
    if (expedition.qrImageBase64.startsWith('data:image')) {
      return expedition.qrImageBase64;
    }
    return `data:image/png;base64,${expedition.qrImageBase64}`;
  }

  onBack(): void {
    if (this.projectId) {
      this.router.navigate(['/projets/detail', this.projectId]);
      return;
    }
    this.router.navigate(['/projets']);
  }

  private syncExpedition(updated: ExpeditionDto): void {
    const index = this.expeditions.findIndex((item) => item.id === updated.id);
    if (index >= 0) {
      this.expeditions[index] = updated;
      this.expeditions = [...this.expeditions];
    } else {
      this.expeditions = [updated, ...this.expeditions];
    }
    this.applyProjectDeliveryCompletion();
    this.buildCreateLines(this.projectOfs);
    if (!this.canCreateExpedition()) {
      this.showCreateForm = false;
    }
    this.selectExpedition(updated);
  }

  private applyCreateDefaults(): void {
    if (!this.project) {
      return;
    }

    this.createForm.patchValue({
      plannedShipDate: this.createForm.value.plannedShipDate || this.formatDate(this.project.dateLimiteLivraison),
      notes: this.createForm.value.notes || this.project.conditionsLivraison || ''
    });
  }

  private buildCreateLines(ofs: OrdreFabrication[]): void {
    this.createLineControls.clear();

    let remaining = this.remainingProjectQuantity;
    ofs.forEach(of => {
      const defaultQty = this.defaultQuantityForOf(of);
      const quantity = Math.max(0, Math.min(defaultQty, remaining));
      remaining = Math.max(0, remaining - quantity);
      this.createLineControls.push(this.fb.group({
        selected: [quantity > 0],
        ofId: [of.id],
        quantity: [quantity, [Validators.required, Validators.min(0)]],
        volume: [null as number | null],
        lotNumber: [this.defaultLotNumberForOf(of)],
        unit: [this.projectUnit()]
      }));
    });
  }

  getCreateLineMax(index: number): number {
    const controls = this.createLineControls.controls;
    if (!controls[index]) return 0;

    const current = Number(controls[index].value.quantity || 0);
    const others = controls
      .filter((_, i) => i !== index && !!controls[i].value.selected)
      .reduce((sum, c) => sum + Number(c.value.quantity || 0), 0);

    const max = this.remainingProjectQuantity - others + current;
    return Math.max(0, max);
  }

  clampCreateLineQuantity(index: number): void {
    const control = this.createLineControls.at(index);
    if (!control) return;

    const selected = !!control.value.selected;
    if (!selected) return;

    const max = this.getCreateLineMax(index);
    const value = Number(control.value.quantity || 0);
    const clamped = Math.max(0, Math.min(value, max));

    if (clamped !== value) {
      control.patchValue({ quantity: clamped }, { emitEvent: false });
      this.toast.info('AUTO.QUANTITE_AJUSTEE_AU_MAXIMUM_AUTORISE', { value0: max });
    }
  }

  private applyDefaultUnitToCreateLines(): void {
    this.createLineControls.controls.forEach(control => {
      if (!control.value.unit || control.value.unit === 'UNIT') {
        control.patchValue({ unit: this.projectUnit() });
      }
    });
  }

  private defaultQuantityForOf(of: OrdreFabrication): number {
    return Number(of.quantiteBonne || of.quantiteCible || 0);
  }

  private projectUnit(): string {
    return this.project?.unite === 'LITRES' ? 'L' : 'UNIT';
  }

  private applyProjectDeliveryCompletion(): void {
    if (!this.project || this.projectTargetQuantity <= 0 || this.deliveredProjectQuantity < this.projectTargetQuantity) {
      return;
    }

    if (!this.isCompletedProjectStatus(this.project.statut)) {
      this.project = {
        ...this.project,
        statut: 'VALIDE'
      };
    }
  }

  private isCompletedProjectStatus(status?: string | null): boolean {
    const normalized = (status || '').trim().toUpperCase();
    return normalized === 'VALIDE' || normalized === 'COMPLETED' || normalized === 'ACCEPTE';
  }

  private defaultLotNumberForOf(of: OrdreFabrication): string {
    const raw =
      (of as any).lotNumber ||
      (of as any).lotVracNumber ||
      (of as any).lotVracCode ||
      (of as any).lotVracName ||
      '';

    const value = String(raw || '').trim();
    return this.isUuidLike(value) ? '' : value;
  }

  private isUuidLike(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private formatDate(date?: string): string {
    if (!date) {
      return '';
    }
    return date.includes('T') ? date.substring(0, 10) : date;
  }

  private trimToUndefined(value?: string | null): string | undefined {
    if (value == null) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  private pushTraceabilityItem(items: Array<{ label: string; value: string }>, label: string, value: unknown): void {
    if (value == null || value === '') {
      return;
    }
    items.push({ label, value: String(value) });
  }

  private countSnapshotItems(value: unknown): string | null {
    if (Array.isArray(value)) {
      return value.length ? String(value.length) : null;
    }
    if (value && typeof value === 'object') {
      return String(Object.keys(value).length);
    }
    return value == null || value === '' ? null : String(value);
  }
}
