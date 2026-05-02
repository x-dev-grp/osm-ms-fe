import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ProjetDto } from '../../../models/TypeProduit';
import { ProjetService } from '../../../services/projet.service';
import {
  ExpeditionDto,
  ExpeditionStatus
} from '../../../models/expedition.model';
import { ExpeditionService } from '../../../services/expedition.service';
import { OFService } from '../../../../OF/services/OFService';
import { OrdreFabrication } from '../../../../OF/models/of.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { PdfGeneratorExpeditionService } from '../../../../shared/services/pdf-generator-expedition.service';
import { CompanyProfileService } from '../../../../shared/services/company-profile.service';
import { PdfExpeditionConfig } from '../../../../shared/models/pdf-config.model';

@Component({
  selector: 'app-projet-expedition',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, MatButtonModule, MatIconModule],
  templateUrl: './projet-expedition.component.html',
  styleUrls: ['./projet-expedition.component.scss']
})
export class ProjetExpeditionComponent implements OnInit {
  readonly statusValues: ExpeditionStatus[] = Object.values(ExpeditionStatus);

  projectId: string | null = null;
  project: ProjetDto | null = null;
  projectOfs: OrdreFabrication[] = [];
  companyProfile: any = null;

  expeditions: ExpeditionDto[] = [];
  selectedExpedition: ExpeditionDto | null = null;

  loading = false;
  saving = false;
  creating = false;
  addingLine = false;
  actionLoading = false;
  showTraceability = false;

  readonly createForm = this.fb.group({
    destination: [''],
    plannedShipDate: [''],
    notes: ['']
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
    articleId: ['', Validators.required],
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
    private pdfService: PdfGeneratorExpeditionService,
    private companyService: CompanyProfileService
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

  toggleTraceability() {
    this.showTraceability = !this.showTraceability;
  }

  generatePDF(exp: ExpeditionDto) {
    const snapshot = this.getParsedSnapshot(exp);
    const config: PdfExpeditionConfig = {
      title: 'Bon de Livraison & Traçabilité',
      reference: exp.expeditionNumber,
      date: new Date(exp.createdDate || '').toLocaleDateString(),
      clientInfo: {
        name: this.project?.clientNom,
        address: '' // Address not in ProjetDto, could be added later
      },
      logistics: {
        carrier: exp.carrierName,
        driver: exp.driverName,
        truck: exp.truckNumber,
        tracking: exp.trackingNumber,
        incoterm: exp.incoterm,
        destination: exp.destination
      },
      lines: (exp.lines || []).map(l => ({
        ofCode: l.ofCode || '',
        articleName: l.articleName || '',
        quantity: l.quantity,
        unit: l.unit || '',
        lotNumber: l.lotNumber || ''
      })),
      traceability: snapshot,
      companyInfo: {
        companyName: this.companyProfile?.companyName,
        address: this.companyProfile?.address,
        logoUrl: this.companyProfile?.logoData ? `data:${this.companyProfile.logoContentType};base64,${this.companyProfile.logoData}` : undefined
      }
    };

    this.pdfService.generatePdf(config);
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (!this.projectId) {
      this.onBack();
      return;
    }

    this.loadProject(this.projectId);
    this.loadExpeditions(this.projectId);
    this.loadProjectOfs(this.projectId);
    
    this.companyService.getProfile().subscribe((p: any) => this.companyProfile = p);
  }

  private loadProject(id: string): void {
    this.projetService.getById(id).subscribe({
      next: (project) => (this.project = project),
      error: (err) => {
        console.error('Erreur chargement projet', err);
        this.toast.error('Erreur lors du chargement du projet');
      }
    });
  }

  private loadExpeditions(projectId: string): void {
    this.loading = true;
    this.expeditionService.getByProject(projectId).subscribe({
      next: (items) => {
        this.expeditions = items;
        this.selectedExpedition = items.length ? items[0] : null;
        if (this.selectedExpedition) {
          this.patchEditForm(this.selectedExpedition);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement expeditions', err);
        this.toast.error('Erreur lors du chargement des expéditions');
        this.loading = false;
      }
    });
  }

  private loadProjectOfs(projectId: string): void {
    this.ofService.getByProject(projectId).subscribe({
      next: (ofs: any[]) => (this.projectOfs = ofs),
      error: (err: any) => console.error('Erreur chargement OFs du projet', err)
    });
  }

  selectExpedition(expedition: ExpeditionDto): void {
    this.selectedExpedition = expedition;
    this.patchEditForm(expedition);
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
        articleId: selectedOf.skuId, // In this context, articleId usually matches skuId of the OF
        unit: this.project?.unite === 'LITRES' ? 'L' : 'UNIT'
      });
    } else {
      this.lineForm.patchValue({ ofId: '', articleId: '' });
    }
  }

  createExpedition(): void {
    if (!this.projectId || this.creating) {
      return;
    }

    this.creating = true;
    this.expeditionService
      .create({
        projetId: this.projectId,
        destination: this.createForm.value.destination ?? undefined,
        plannedShipDate: this.createForm.value.plannedShipDate ?? undefined,
        notes: this.createForm.value.notes ?? undefined
      })
      .subscribe({
        next: (expedition) => {
          this.creating = false;
          this.createForm.reset({ destination: '', plannedShipDate: '', notes: '' });
          this.expeditions = [expedition, ...this.expeditions];
          this.selectExpedition(expedition);
          this.toast.success('Expédition créée avec succès');
        },
        error: (err) => {
          console.error('Erreur creation expedition', err);
          this.toast.error('Erreur lors de la création de l\'expédition');
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
          this.toast.success('Modifications enregistrées');
        },
        error: (err) => {
          console.error('Erreur sauvegarde expedition', err);
          this.toast.error('Erreur lors de la sauvegarde');
          this.saving = false;
        }
      });
  }

  addLine(): void {
    if (!this.selectedExpedition?.id || this.addingLine || this.lineForm.invalid) {
      this.lineForm.markAllAsTouched();
      if (this.lineForm.invalid) {
        this.toast.warning('Veuillez sélectionner un OF et saisir une quantité');
      }
      return;
    }

    this.addingLine = true;
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
          this.toast.success('Ligne ajoutée');
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

    if (!confirm('Supprimer cette ligne ?')) {
      return;
    }

    this.expeditionService.removeLine(this.selectedExpedition.id, lineId).subscribe({
      next: (updated) => {
        this.syncExpedition(updated);
        this.toast.success('Ligne supprimée');
      },
      error: (err) => {
        console.error('Erreur suppression ligne', err);
        this.toast.error('Erreur lors de la suppression');
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
        this.toast.success(`Action ${action.toUpperCase()} effectuée`);
      },
      error: (err) => {
        console.error('Erreur action expedition', err);
        const msg = err.error?.message || `Erreur lors de l'action ${action}`;
        this.toast.error(msg);
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
          this.toast.warning('Aucune expédition trouvée pour ce code');
          return;
        }
        this.expeditionService.getById(resolved.entityId).subscribe({
          next: (expedition) => {
            this.syncExpedition(expedition);
            this.toast.info('Expédition chargée');
          },
          error: (err) => {
            console.error('Erreur chargement expedition resolue', err);
            this.toast.error('Erreur lors du chargement de l\'expédition trouvée');
          }
        });
      },
      error: (err) => {
        console.error('Erreur resolve expedition', err);
        this.toast.error('Code introuvable');
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

  isEditable(): boolean {
    const status = this.selectedExpedition?.status;
    return status === ExpeditionStatus.DRAFT || status === ExpeditionStatus.READY;
  }

  statusLabel(status?: ExpeditionStatus): string {
    if (!status) {
      return '-';
    }
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
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
    this.selectExpedition(updated);
  }

  private trimToUndefined(value?: string | null): string | undefined {
    if (value == null) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
}
