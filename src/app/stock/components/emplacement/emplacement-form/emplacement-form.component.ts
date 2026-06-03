import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmplacementStockService } from '../../../services/emplacement-stock.service';
import { EmplacementStock, TypeEmplacement } from '../../../models/emplacement-stock.model';
import { CategorieArticle } from '../../../models/article.model';

@Component({
  selector: 'app-emplacement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './emplacement-form.component.html',
  styleUrls: ['./emplacement-form.component.scss']
})
export class EmplacementFormComponent implements OnInit {
  emplacementForm: FormGroup;
  isEditMode = false;
  emplacementId?: string;
  submitted = false;
  submitting = false;
  loading = false;
  error = '';

  typesEmplacement = Object.values(TypeEmplacement);
  categoriesArticle = Object.values(CategorieArticle);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private emplacementService: EmplacementStockService
  ) {
    this.emplacementForm = this.fb.group({
      code: [{ value: '', disabled: true }],
      nom: ['', Validators.required],
      typeEmplacement: ['', Validators.required],
      categorieArticleStocke: [null],
      capaciteMaximale: [null],
      capaciteActuelle: [null],
      zone: [''],
      disponible: [true],
      reservePour: [''],
      conditionsSpeciales: [''],
      temperatureMin: [null],
      temperatureMax: [null],
      description: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.emplacementId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.emplacementId;

    this.emplacementForm.get('disponible')?.valueChanges.subscribe((available) => {
      if (available) {
        this.emplacementForm.get('reservePour')?.disable();
        this.emplacementForm.get('reservePour')?.setValue('');
      } else {
        this.emplacementForm.get('reservePour')?.enable();
      }
    });

    if (!this.isEditMode && this.emplacementForm.get('disponible')?.value) {
      this.emplacementForm.get('reservePour')?.disable();
    }

    if (this.isEditMode) {
      this.loadEmplacement();
    }
  }

  get f() {
    return this.emplacementForm.controls;
  }

  loadEmplacement(): void {
    if (!this.emplacementId) return;

    this.loading = true;

    this.emplacementService.getEmplacementById(this.emplacementId).subscribe({
      next: (response) => {
        const emp: EmplacementStock = (response.data || []).flat()[0];

        if (emp) {
          this.emplacementForm.patchValue({
            code: emp.code,
            nom: emp.nom,
            typeEmplacement: emp.typeEmplacement,
            categorieArticleStocke: emp.categorieArticleStocke ?? null,
            capaciteMaximale: emp.capaciteMaximale,
            capaciteActuelle: emp.capaciteActuelle,
            zone: emp.zone,
            disponible: emp.disponible,
            reservePour: emp.reservePour,
            conditionsSpeciales: emp.conditionsSpeciales,
            temperatureMin: emp.temperatureMin,
            temperatureMax: emp.temperatureMax,
            description: emp.description,
            notes: emp.notes
          });

          if (emp.disponible) {
            this.emplacementForm.get('reservePour')?.disable();
          } else {
            this.emplacementForm.get('reservePour')?.enable();
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Impossible de charger l'emplacement";
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.emplacementForm.invalid) {
      this.submitting = false;
      return;
    }

    this.error = '';
    this.submitting = true;

    const emplacement: EmplacementStock = this.emplacementForm.getRawValue();
    if (!emplacement.categorieArticleStocke) {
      delete emplacement.categorieArticleStocke;
    }

    if (this.isEditMode) {
      emplacement.code = this.emplacementForm.get('code')?.value;
    }

    this.loading = true;

    if (this.isEditMode && this.emplacementId) {
      this.emplacementService.updateEmplacement(this.emplacementId, emplacement).subscribe({
        next: () => this.router.navigate(['/stock/emplacements']),
        error: (err) => {
          console.error(err);
          this.error = 'Erreur lors de la mise a jour';
          this.loading = false;
          this.submitting = false;
        }
      });
    } else {
      this.emplacementService.createEmplacement(emplacement).subscribe({
        next: () => this.router.navigate(['/stock/emplacements']),
        error: (err) => {
          console.error(err);
          this.error = 'Erreur lors de la creation';
          this.loading = false;
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/stock/emplacements']);
  }

  getTypeLabel(type: TypeEmplacement): string {
    const labels: Record<TypeEmplacement, string> = {
      [TypeEmplacement.CHAMBRE_FROIDE]: 'Chambre froide',
      [TypeEmplacement.CONGELATEUR]: 'Congelateur',
      [TypeEmplacement.ZONE_DANGEREUSE]: 'Zone dangereuse',
      [TypeEmplacement.ZONE_SECURISEE]: 'Zone securisee',
      [TypeEmplacement.QUAI_RECEPTION]: 'Quai de reception',
      [TypeEmplacement.QUAI_EXPEDITION]: "Quai d'expedition",
      [TypeEmplacement.ZONE_CONTROLE]: 'Zone de controle',
      [TypeEmplacement.ZONE_RECONDITIONNEMENT]: 'Zone de reconditionnement'
    };
    return labels[type] || type;
  }

  getCategorieLabel(categorie: CategorieArticle): string {
    const labels: Record<CategorieArticle, string> = {
      [CategorieArticle.EMBALLAGE]: 'Emballage',
      [CategorieArticle.CONSOMMABLE]: 'Consommable',
      [CategorieArticle.UNITE]: 'Unite',
      [CategorieArticle.COLIS]: 'Colis',
      [CategorieArticle.PALETTE]: 'Palette'
    };
    return labels[categorie] || categorie;
  }
}

