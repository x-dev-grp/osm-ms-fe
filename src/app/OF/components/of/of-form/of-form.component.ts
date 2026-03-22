import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {LigneConditionnement} from "../../../../stock/models/ligne-conditionnement.model";
import {SKU} from "../../../../stock/models/sku.model";
import {OFService} from "../../../services/OFService";
import {LigneConditionnementService} from "../../../../stock/services/ligne-conditionnement.service";
import {OrdreFabrication, StatutOF} from "../../../models/of.model";
import {SKUService} from "../../../../stock/services/sku.service";
import {Bom} from "../../../../stock/models/Bom";
import {BomService} from "../../../../stock/services/BomService";

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
  lignes: LigneConditionnement[] = [];
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
    private bomService: BomService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSkus();
    this.loadLignes();
    this.ofForm.get('skuId')?.valueChanges.subscribe(skuId => {
      if (skuId) {
        this.loadBomsForSku(skuId);
      } else {
        this.boms = [];
        this.ofForm.get('bomId')?.setValue('');
      }
    });
  }

  private initForm(): void {
    this.ofForm = this.fb.group({
      skuId: ['', Validators.required],
      bomId: ['', Validators.required],
      ligneId: [''],
      lotVracId: [''],
      quantiteCible: [null, [Validators.required, Validators.min(1)]],
      dateDebutPrevue: [''],
      dateFinPrevue: ['']
    });
  }

  loadSkus(): void {
    this.skuService.getActiveSKUs().subscribe((data: SKU[]) => this.skus = data);
  }

  loadLignes(): void {
    this.ligneService.getActiveLignes().subscribe(data => this.lignes = data);
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
      skuId: formValue.skuId,
      bomId: formValue.bomId,
      ligneId: formValue.ligneId || undefined,
      lotVracId: formValue.lotVracId || undefined,
      quantiteCible: formValue.quantiteCible,
      dateDebutPrevue: formValue.dateDebutPrevue || undefined,
      dateFinPrevue: formValue.dateFinPrevue || undefined,
      statut: StatutOF.BROUILLON,
      quantiteBonne: 0,
      quantiteNC: 0
    };

    this.ofService.create(newOF).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/of']);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        alert('Erreur lors de la création');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/of']);
  }
}
