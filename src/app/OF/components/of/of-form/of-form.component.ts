import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LigneConditionnement } from "../../../../stock/models/ligne-conditionnement.model";
import { Product, productDisplayName } from "../../../../stock/models/sku.model";
import { OFService } from "../../../services/OFService";
import { LigneConditionnementService } from "../../../../stock/services/ligne-conditionnement.service";
import { OrdreFabrication, StatutOF } from "../../../models/of.model";
import { SKUService } from "../../../../stock/services/sku.service";
import { Bom } from "../../../../stock/models/Bom";
import { BomService } from "../../../../stock/services/BomService";
import { ToastService } from "../../../../shared/services/toast.service";
import { StorageUnitDtoService } from "../../../../shared/services/storage.service";
import { StorageUnitDto } from "../../../../shared/models/StorageUnitDto";
import { ProjetService } from "../../../../projet/services/projet.service";
import { ProjetDto } from "../../../../projet/models/TypeProduit";
import { TraceabilityPreviewComponent } from "../../../../shared/components/traceability-preview/traceability-preview.component";
import { MaterialNeedsPreviewComponent } from '../../../../shared/components/material-needs-preview/material-needs-preview.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-of-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, ReactiveFormsModule, RouterLink, TraceabilityPreviewComponent, MaterialNeedsPreviewComponent],
  templateUrl: './of-form.component.html',
  styleUrls: ['./of-form.component.scss']
})
export class OFFormComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  ofForm!: FormGroup;
  products: Product[] = [];
  projects: ProjetDto[] = [];
  lignes: LigneConditionnement[] = [];
  storageUnits: StorageUnitDto[] = [];
  loading = false;
  isSubmitting = false;
  loadingBoms = false;
  boms: Bom[] = [];
  isEditMode = false;
  ofId: string | null = null;
  selectedProject: ProjetDto | null = null;
  projectRemainingQuantity: number | null = null;
  private preferredProjectBomId: string | null = null;

  get exceedsProjectRemaining(): boolean {
    const qty = Number(this.ofForm?.get('quantiteCible')?.value || 0);
    return this.projectRemainingQuantity !== null && qty > this.projectRemainingQuantity;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private ofService: OFService,
    private skuService: SKUService,
    private ligneService: LigneConditionnementService,
    private bomService: BomService,
    private storageService: StorageUnitDtoService,
    private projetService: ProjetService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadSkus();
    this.loadProjects();
    this.loadLignes();
    this.loadStorageUnits();

    this.ofId = this.route.snapshot.paramMap.get('id');
    if (this.ofId) {
      this.isEditMode = true;
      this.loadOF(this.ofId);
    }

    this.ofForm.get('productId')?.valueChanges.subscribe(productId => {
      if (productId) {
        this.loadBomsForProduct(productId);
      } else {
        this.boms = [];
        this.ofForm.get('bomId')?.setValue('');
      }
    });

    this.ofForm.get('projectId')?.valueChanges.subscribe(projectId => {
      if (projectId) {
        const p = this.projects.find(x => x.id === projectId);
        if (p) {
          this.selectedProject = p;
          this.applyProjectDefaults(p);
          this.calculateRemainingQuantity(projectId);
        }
      } else {
        this.selectedProject = null;
        this.projectRemainingQuantity = null;
      }
    });
  }

  calculateRemainingQuantity(projectId: string): void {
    this.ofService.getByProject(projectId).subscribe(data => {
      const existingOfs = (data as any)?.data ? (data as any).data : data;
      const otherOfs = this.isEditMode && this.ofId
        ? existingOfs.filter((o: any) => o.id !== this.ofId)
        : existingOfs;

      const sumExisting = otherOfs.reduce((sum: number, o: any) => sum + (o.quantiteCible || 0), 0);
      this.projectRemainingQuantity = (this.selectedProject?.quantiteCible || 0) - sumExisting;

      if (!this.isEditMode && this.projectRemainingQuantity > 0) {
        this.ofForm.patchValue({ quantiteCible: this.projectRemainingQuantity });
      }
    });
  }

  private initForm(): void {
    this.ofForm = this.fb.group({
      projectId: ['', Validators.required],
      productId: ['', Validators.required],
      bomId: ['', Validators.required],
      ligneId: [''],
      lotVracId: [''],
      quantiteCible: [null, [Validators.required, Validators.min(1)]],
      dateDebutPrevue: [''],
      dateFinPrevue: ['']
    }, { validators: this.dateRangeValidator });
  }
  private dateRangeValidator(group: FormGroup): ValidationErrors | null {
    const debut = group.get('dateDebutPrevue')?.value;
    const fin = group.get('dateFinPrevue')?.value;
    if (debut && fin && new Date(debut) > new Date(fin)) {
      return { dateFinAfterDebut: true };
    }
    return null;
  }


  loadSkus(): void {
    this.skuService.getActiveProductsByType('NON_VRAC').subscribe((data: Product[]) => this.products = data);
  }

  loadProjects(): void {
    this.projetService.getAll().subscribe(data => {
      this.projects = data;
      const projectId = this.route.snapshot.queryParamMap.get('projetId');
      if (projectId) {
        this.ofForm.patchValue({ projectId: projectId });
        this.ofForm.get('projectId')?.disable();
      }
    });
  }

  loadLignes(): void {
    this.ligneService.getActiveLignes().subscribe(data => {
      this.lignes = data;
      this.autoSelectSingleOption('ligneId', this.lignes);
    });
  }

  loadStorageUnits(): void {
    this.storageService.getAllStorageUnit().subscribe({
      next: (resp) => {
        if (resp && resp.data) {
          // Filtrer les cuves qui ont de l'huile (volume > 0) ET qui est FILTRÉE
          this.storageUnits = Array.isArray(resp.data)
            ? resp.data.filter(u => (u.currentVolume || 0) > 0 && u.filteredOil === true)
            : [];
          this.autoSelectSingleOption('lotVracId', this.storageUnits);
        }
      },
      error: (err) => console.error('Erreur chargement cuves', err)
    });
  }

  loadBomsForProduct(productId: string): void {
    this.loadingBoms = true;
    this.bomService.getBomsByProduct(productId).subscribe({
      next: (boms) => {
        this.boms = boms;
        const currentBomId = this.ofForm.get('bomId')?.value;
        const projectBom = this.preferredProjectBomId
          ? boms.find(bom => bom.id === this.preferredProjectBomId)
          : null;

        const activeBom = boms.find((bom) => bom.active);
        if (currentBomId && boms.some(bom => bom.id === currentBomId)) {
          this.ofForm.get('bomId')?.setValue(currentBomId);
        } else if (projectBom) {
          this.ofForm.get('bomId')?.setValue(projectBom.id);
        } else if (activeBom?.id) {
          this.ofForm.get('bomId')?.setValue(activeBom.id);
        } else if (boms.length === 1) {
          this.ofForm.get('bomId')?.setValue(boms[0].id);
        } else if (boms.length === 0) {
          this.ofForm.get('bomId')?.setErrors({ noBom: true });
        }
        this.loadingBoms = false;
      },
      error: (err) => {
        console.error('Erreur chargement des Nomenclatures', err);
        this.boms = [];
        this.ofForm.get('bomId')?.setErrors({ serverError: true });
        this.loadingBoms = false;
      }
    });
  }

  loadOF(id: string): void {
    this.loading = true;
    this.ofService.getById(id).subscribe({
      next: (of) => {
        this.ofForm.patchValue({
          projectId: of.projectId,
          productId: of.productId || of.skuId,
          bomId: of.bomId,
          ligneId: of.ligneId,
          lotVracId: of.lotVracId,
          quantiteCible: of.quantiteCible,
          dateDebutPrevue: this.formatDate(of.dateDebutPrevue),
          dateFinPrevue: this.formatDate(of.dateFinPrevue)
        });
        this.ofForm.get('projectId')?.disable();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement OF:', err);
        this.toast.error('AUTO.IMPOSSIBLE_DE_CHARGER_LES_DONNEES_DE_L_OF');
        this.loading = false;
      }
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private toLocalDateTime(date: string | null | undefined, boundary: 'start' | 'end'): string | undefined {
    if (!date) {
      return undefined;
    }

    if (date.includes('T')) {
      return date;
    }

    return boundary === 'start'
      ? `${date}T00:00:00`
      : `${date}T23:59:59`;
  }

  private applyProjectDefaults(project: ProjetDto): void {
    if (this.isEditMode) {
      return;
    }

    this.preferredProjectBomId = project.bomId ?? null;

    this.ofForm.patchValue({
      productId: project.productId || project.skuId || this.ofForm.get('productId')?.value || '',
      bomId: project.bomId || this.ofForm.get('bomId')?.value || '',
      dateDebutPrevue: this.ofForm.get('dateDebutPrevue')?.value || this.todayDate(),
      dateFinPrevue: project.dateLimiteLivraison ? this.formatDate(project.dateLimiteLivraison) : this.ofForm.get('dateFinPrevue')?.value
    });
  }

  private autoSelectSingleOption(controlName: 'ligneId' | 'lotVracId', options: Array<{ id?: string }>): void {
    if (this.isEditMode || this.ofForm.get(controlName)?.value || options.length !== 1) {
      return;
    }

    this.ofForm.get(controlName)?.setValue(options[0].id || '');
  }

  private todayDate(): string {
    return this.formatDate(new Date());
  }

  onSubmit(): void {
    if (this.ofForm.invalid) {
      this.ofForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.ofForm.getRawValue();

    // Validation métier: Quantité totale projet
    if (this.selectedProject && this.projectRemainingQuantity !== null) {
      if (formValue.quantiteCible > this.projectRemainingQuantity) {
        this.toast.error('AUTO.LA_QUANTITE_DEPASSE_LE_RESTE_A_PRODUIRE_DU_PROJET', { value0: formValue.quantiteCible, value1: this.projectRemainingQuantity, value2: this.selectedProject.unite || '' });
        this.isSubmitting = false;
        return;
      }
    }

    const newOF: OrdreFabrication = {
      projectId: formValue.projectId || undefined,
      productId: formValue.productId,
      bomId: formValue.bomId,
      ligneId: formValue.ligneId || undefined,
      lotVracId: formValue.lotVracId || undefined,
      quantiteCible: formValue.quantiteCible,
      statut: StatutOF.PLANIFIE,
      quantiteBonne: 0,
      quantiteNC: 0,
      dateDebutPrevue: this.toLocalDateTime(formValue.dateDebutPrevue, 'start'),
      dateFinPrevue: this.toLocalDateTime(formValue.dateFinPrevue, 'end'),
    };

    const request = this.isEditMode && this.ofId
      ? this.ofService.update(this.ofId, newOF)
      : this.ofService.create(newOF);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success(this.isEditMode ? 'AUTO.OF_MIS_A_JOUR_AVEC_SUCCES' : 'AUTO.OF_CREE_AVEC_SUCCES');
        this.router.navigate(['/of']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        let errorMessage = this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_CREATION_DE_L_OF');
        if (err.error) {
          errorMessage = err.error.error || err.error.message || errorMessage;
        } else if (err.message) {
          errorMessage = err.message;
        }
        this.toast.error(errorMessage);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/of']);
  }

  onQuantiteInput(): void {
    if (this.projectRemainingQuantity === null) {
      return;
    }

    const control = this.ofForm.get('quantiteCible');
    const qty = Number(control?.value || 0);
    if (qty > this.projectRemainingQuantity) {
      control?.setValue(this.projectRemainingQuantity);
    }
  }

  productName(product: Product): string {
    return productDisplayName(product);
  }
}
