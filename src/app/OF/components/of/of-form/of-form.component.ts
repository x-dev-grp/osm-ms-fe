import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {LigneConditionnement} from "../../../../stock/models/ligne-conditionnement.model";
import {SKU} from "../../../../stock/models/sku.model";
import {OFService} from "../../../services/OFService";
import {LigneConditionnementService} from "../../../../stock/services/ligne-conditionnement.service";
import {OrdreFabrication, StatutOF} from "../../../models/of.model";
import {SKUService} from "../../../../stock/services/sku.service";
import {Bom} from "../../../../stock/models/Bom";
import {BomService} from "../../../../stock/services/BomService";
import {ToastService} from "../../../../shared/services/toast.service";
import {StorageUnitDtoService} from "../../../../shared/services/storage.service";
import {StorageUnitDto} from "../../../../shared/models/StorageUnitDto";
import {ProjetService} from "../../../../projet/services/projet.service";
import {ProjetDto} from "../../../../projet/models/TypeProduit";

@Component({
  selector: 'app-of-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './of-form.component.html',
  styleUrls: ['./of-form.component.scss']
})
export class OFFormComponent implements OnInit {
  ofForm!: FormGroup;
  skus: SKU[] = [];
  projects: ProjetDto[] = [];
  lignes: LigneConditionnement[] = [];
  storageUnits: StorageUnitDto[] = [];
  loading = false;
  isSubmitting = false;
  loadingBoms = false;
  boms: Bom[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private ofService: OFService,
    private skuService: SKUService,
    private ligneService: LigneConditionnementService,
    private bomService: BomService,
    private storageService: StorageUnitDtoService,
    private projetService: ProjetService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSkus();
    this.loadProjects();
    this.loadLignes();
    this.loadStorageUnits();

    this.ofForm.get('skuId')?.valueChanges.subscribe(skuId => {
      if (skuId) {
        this.loadBomsForSku(skuId);
      } else {
        this.boms = [];
        this.ofForm.get('bomId')?.setValue('');
      }
    });

    this.ofForm.get('projectId')?.valueChanges.subscribe(projectId => {
      if (projectId) {
        const p = this.projects.find(x => x.id === projectId);
        if (p && p.skuId) {
          this.ofForm.get('skuId')?.setValue(p.skuId);
        }
      }
    });
  }

  private initForm(): void {
    this.ofForm = this.fb.group({
      projectId: [''],
      skuId: ['', Validators.required],
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
    this.skuService.getActiveSKUs().subscribe((data: SKU[]) => this.skus = data);
  }

  loadProjects(): void {
    this.projetService.getAll().subscribe(data => this.projects = data);
  }

  loadLignes(): void {
    this.ligneService.getActiveLignes().subscribe(data => this.lignes = data);
  }

  loadStorageUnits(): void {
    this.storageService.getAllStorageUnit().subscribe({
      next: (resp) => {
        if (resp && resp.data) {
          // Filtrer les cuves qui ont de l'huile (volume > 0) ET qui est FILTRÉE
          this.storageUnits = Array.isArray(resp.data) 
            ? resp.data.filter(u => (u.currentVolume || 0) > 0 && u.filteredOil === true)
            : [];
        }
      },
      error: (err) => console.error('Erreur chargement cuves', err)
    });
  }

  loadBomsForSku(skuId: string): void {
    this.loadingBoms = true;
    this.bomService.getBomsBySku(skuId).subscribe({
      next: (boms) => {
        this.boms = boms;
        if (boms.length === 1) {
          this.ofForm.get('bomId')?.setValue(boms[0].id);
        } else if (boms.length === 0) {
          this.ofForm.get('bomId')?.setErrors({ noBom: true });
        }
        this.loadingBoms = false;
      },
      error: (err) => {
        console.error('Erreur chargement BOMs', err);
        this.boms = [];
        this.ofForm.get('bomId')?.setErrors({ serverError: true });
        this.loadingBoms = false;
      }
    });
  }

  onSubmit(): void {
    if (this.ofForm.invalid) {
      this.ofForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.ofForm.value;
    const newOF: OrdreFabrication = {
      projectId: formValue.projectId || undefined,
      skuId: formValue.skuId,
      bomId: formValue.bomId,
      ligneId: formValue.ligneId || undefined,
      lotVracId: formValue.lotVracId || undefined,
      quantiteCible: formValue.quantiteCible,
      statut: StatutOF.PLANIFIE,
      quantiteBonne: 0,
      quantiteNC: 0,
      dateDebutPrevue: formValue.dateDebutPrevue || undefined,
      dateFinPrevue: formValue.dateFinPrevue || undefined,
    };

    this.ofService.create(newOF).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('OF créé avec succès');
        this.router.navigate(['/of']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        let errorMessage = 'Erreur lors de la création de l\'OF';
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
}
