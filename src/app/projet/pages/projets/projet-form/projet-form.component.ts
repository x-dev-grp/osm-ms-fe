import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProjetDto, TypeEmballage, TypeProduit } from '../../../models/TypeProduit';
import {Client, ClientType} from '../../../models/client.model';
import { ProjetService } from '../../../services/projet.service';
import { ClientService } from '../../../services/client.service';
import { LigneConditionnement } from '../../../../stock/models/ligne-conditionnement.model';
import { LigneConditionnementService } from '../../../../stock/services/ligne-conditionnement.service';
import { SKUService } from '../../../../stock/services/sku.service';
import { BomService } from '../../../../stock/services/BomService';
import { SKU } from '../../../../stock/models/sku.model';
import { Bom } from '../../../../stock/models/Bom';

@Component({
  selector: 'app-projet-form',
  standalone: true,
  templateUrl: './projet-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TitleCasePipe,
    CurrencyPipe
  ],
  styleUrls: ['./projet-form.component.scss']
})
export class ProjetFormComponent implements OnInit {
  form!: FormGroup;
  clients: Client[] = [];
  lignes: LigneConditionnement[] = [];
  skus: SKU[] = [];
  productBoms: { [productId: string]: Bom[] } = {};
  
  typeProduits: TypeProduit[] = Object.values(TypeProduit);
  typeEmballages: TypeEmballage[] = Object.values(TypeEmballage);
  unites: Array<'LITRES' | 'UNITES'> = ['LITRES', 'UNITES'];

  isEdit = false;
  projetId: string | null = null;
  loading = false;
  valeurTotaleEstimee = 0;
  projetCode?: string;
  bomSummary: { articleId: string; articleName: string; totalQuantity: number; unit: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private projetService: ProjetService,
    private clientService: ClientService,
    private ligneService: LigneConditionnementService,
    private skuService: SKUService,
    private bomService: BomService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.listenValeurTotale();
    this.loadClients();
    this.loadLignes();
    this.loadSkus();

    this.projetId = this.route.snapshot.paramMap.get('id');

    if (this.projetId) {
      this.isEdit = true;
      this.loadProjet();
    }
  }

  get produits(): FormArray {
    return this.form.get('produits') as FormArray;
  }

  private initForm(): void {
    this.form = this.fb.group({
      clientId: ['', Validators.required],
      typeProduit: [TypeProduit.EXTRA_VIERGE, Validators.required],
      typeEmballage: [TypeEmballage.BOUTEILLE, Validators.required],
      quantiteCible: [null, [Validators.required, Validators.min(1)]],
      unite: ['LITRES', Validators.required],
      dateLimiteLivraison: ['', Validators.required],
      prixUnitaire: [null, [Validators.required, Validators.min(0.01)]],
      conditionsLivraison: ['', [Validators.required, Validators.maxLength(2000)]],
      ligneIds: [[], Validators.required],
      statut: ['BROUILLON'],
      produits: this.fb.array([])
    });
  }

  addProduit(productId: string = '', bomId: string = '', quantiteCible: number | null = null) {
    const produitGroup = this.fb.group({
      productId: [productId, Validators.required],
      bomId: [bomId, Validators.required],
      quantiteCible: [quantiteCible, [Validators.required, Validators.min(1)]]
    });

    produitGroup.get('productId')?.valueChanges.subscribe(id => {
      if (id) {
        this.loadBomsForProduct(id);
      }
    });

    if (productId) {
      this.loadBomsForProduct(productId);
    }

    this.produits.push(produitGroup);
  }

  removeProduit(index: number) {
    this.produits.removeAt(index);
  }

  private listenValeurTotale(): void {
    this.form.valueChanges.subscribe(() => {
      this.valeurTotaleEstimee = this.calculValeurTotale();
      this.updateGlobalQuantity();
      this.calculateSummary();
    });

    this.valeurTotaleEstimee = this.calculValeurTotale();
    this.calculateSummary();
  }

  updateGlobalQuantity(): void {
    let total = 0;
    this.produits.controls.forEach(control => {
      total += Number(control.get('quantiteCible')?.value || 0);
    });

    if (total > 0 && this.form.get('quantiteCible')?.value !== total) {
      this.form.get('quantiteCible')?.setValue(total, { emitEvent: false });
    }
  }

  calculateSummary(): void {
    const summaryMap = new Map<string, { name: string; total: number; unit: string }>();

    this.produits.controls.forEach(control => {
      const productId = control.get('productId')?.value;
      const bomId = control.get('bomId')?.value;
      const qteCible = control.get('quantiteCible')?.value || 0;

      if (productId && bomId && qteCible > 0) {
        const boms = this.productBoms[productId] || [];
        const selectedBom = boms.find(b => b.id === bomId);

        if (selectedBom && selectedBom.lines) {
          selectedBom.lines.forEach(line => {
            const existing = summaryMap.get(line.articleId);
            const needed = line.quantity * qteCible;
            if (existing) {
              existing.total += needed;
            } else {
              summaryMap.set(line.articleId, {
                name: line.articleName || 'Article inconnu',
                total: needed,
                unit: line.unitOfMeasure || 'Unité'
              });
            }
          });
        }
      }
    });

    this.bomSummary = Array.from(summaryMap.entries()).map(([id, data]) => ({
      articleId: id,
      articleName: data.name,
      totalQuantity: data.total,
      unit: data.unit
    }));
  }

  private loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data || [];
      },
      error: (err: unknown) => {
        console.error('Erreur chargement clients', err);
        this.clients = [];
      }
    });
  }

  private loadLignes(): void {
    this.ligneService.getActiveLignes().subscribe({
      next: (data: LigneConditionnement[]) => {
        this.lignes = data || [];
      },
      error: (err: unknown) => {
        console.error('Erreur chargement lignes', err);
        this.lignes = [];
      }
    });
  }

  private loadSkus(): void {
    this.skuService.getAllProducts().subscribe({
      next: (data: SKU[]) => {
        this.skus = data || [];
      },
      error: (err: unknown) => {
        console.error('Erreur chargement SKUs', err);
        this.skus = [];
      }
    });
  }

  private loadBomsForProduct(productId: string): void {
    if (!this.productBoms[productId]) {
      this.bomService.getBomsByProduct(productId).subscribe({
        next: (boms) => {
          this.productBoms[productId] = boms || [];
        },
        error: (err) => console.error('Erreur chargement BOMs pour produit', err)
      });
    }
  }

  private loadProjet(): void {
    if (!this.projetId) {
      return;
    }

    this.projetService.getById(this.projetId).subscribe({
      next: (projet: any) => {
        this.projetCode = projet.code;

        this.form.patchValue({
          clientId: projet.clientId ?? projet.client?.id ?? '',
          typeProduit: projet.typeProduit,
          typeEmballage: projet.typeEmballage,
          quantiteCible: projet.quantiteCible,
          unite: projet.unite,
          dateLimiteLivraison: projet.dateLimiteLivraison,
          prixUnitaire: projet.prixUnitaire,
          conditionsLivraison: projet.conditionsLivraison,
          ligneIds: projet.ligneIds ?? [],
          statut: projet.statut ?? 'BROUILLON'
        });

        if (projet.produits && projet.produits.length > 0) {
          projet.produits.forEach((p: any) => {
            this.addProduit(p.productId, p.bomId, p.quantiteCible);
          });
        } else if (projet.productId) {
          // Backward compatibility
          this.addProduit(projet.productId, projet.bomId, projet.quantiteCible);
        }

        this.valeurTotaleEstimee = this.calculValeurTotale();
      },
      error: (err: unknown) => {
        console.error('Erreur chargement projet', err);
      }
    });
  }

  calculValeurTotale(): number {
    const qte = Number(this.form?.get('quantiteCible')?.value || 0);
    const prix = Number(this.form?.get('prixUnitaire')?.value || 0);

    return qte * prix;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Veuillez remplir tous les champs obligatoires correctement.');
      return;
    }

    const selectedClient = this.getSelectedClient();

    if (!selectedClient) {
      this.form.get('clientId')?.setErrors({ required: true });
      this.form.get('clientId')?.markAsTouched();
      alert('Veuillez selectionner un client valide.');
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    const request: any = {
      id: this.projetId ?? '',
      code: this.projetCode,

      clientId: selectedClient.id,
      client: selectedClient,

      typeProduit: formValue.typeProduit,
      typeEmballage: formValue.typeEmballage,

      quantiteCible: Number(formValue.quantiteCible),
      unite: formValue.unite,

      dateLimiteLivraison: formValue.dateLimiteLivraison,
      prixUnitaire: Number(formValue.prixUnitaire),
      valeurTotale: this.calculValeurTotale(),

      conditionsLivraison: formValue.conditionsLivraison,
      ligneIds: formValue.ligneIds ?? [],
      
      produits: formValue.produits,

      statut: formValue.statut
    };

    const action = this.isEdit && this.projetId
      ? this.projetService.update(this.projetId, request)
      : this.projetService.create(request);

    action.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['../'], { relativeTo: this.route });
      },
      error: (err: unknown) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }

  isLigneSelected(ligneId?: string): boolean {
    if (!ligneId) {
      return false;
    }

    const selectedIds: string[] = this.form.get('ligneIds')?.value ?? [];
    return selectedIds.includes(ligneId);
  }

  onLigneToggle(ligneId: string | undefined, checked: boolean): void {
    if (!ligneId) {
      return;
    }

    const control = this.form.get('ligneIds');
    const current: string[] = control?.value ?? [];
    const next = checked
      ? Array.from(new Set([...current, ligneId]))
      : current.filter((id) => id !== ligneId);

    control?.setValue(next);
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  private getSelectedClient(): Client | undefined {
    const clientId = this.form.get('clientId')?.value;

    return this.clients.find((client) => client.id === clientId);
  }

  protected readonly ClientType = ClientType;
}
