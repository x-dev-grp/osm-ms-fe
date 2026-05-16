import {Component, OnInit} from '@angular/core';
import {CommonModule, CurrencyPipe, TitleCasePipe} from '@angular/common';
import {FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import {TypeEmballage, TypeProduit} from '../../../models/TypeProduit';
import {Client, ClientType} from '../../../models/client.model';
import {ProjetService} from '../../../services/projet.service';
import {ClientService} from '../../../services/client.service';
import {LigneConditionnement} from '../../../../stock/models/ligne-conditionnement.model';
import {LigneConditionnementService} from '../../../../stock/services/ligne-conditionnement.service';
import {SKUService} from '../../../../stock/services/sku.service';
import {BomService} from '../../../../stock/services/BomService';
import {SKU} from '../../../../stock/models/sku.model';
import {Bom} from '../../../../stock/models/Bom';
import {ArticleService} from '../../../../stock/services/article.service';
import {Article} from '../../../../stock/models/article.model';

@Component({
  selector: 'app-projet-form',
  standalone: true,
  templateUrl: './projet-form.component.html',
  imports: [CommonModule, ReactiveFormsModule, TitleCasePipe, CurrencyPipe],
  styleUrls: ['./projet-form.component.scss']
})
export class ProjetFormComponent implements OnInit {
  form!: FormGroup;

  clients: Client[] = [];
  lignes: LigneConditionnement[] = [];
  skus: SKU[] = [];

  productBoms: { [productId: string]: Bom[] } = {};
  articlesCache: { [articleId: string]: Article } = {};

  typeProduits: TypeProduit[] = Object.values(TypeProduit);
  typeEmballages: TypeEmballage[] = Object.values(TypeEmballage);
  unites: Array<'LITRES' | 'UNITES'> = ['LITRES', 'UNITES'];

  isEdit = false;
  projetId: string | null = null;
  loading = false;
  valeurTotaleEstimee = 0;
  projetCode?: string;

  bomSummary: {
    articleId: string; articleName: string; totalQuantity: number; unit: string;
  }[] = [];

  protected readonly ClientType = ClientType;

  constructor(private fb: FormBuilder, private projetService: ProjetService, private clientService: ClientService, private ligneService: LigneConditionnementService, private skuService: SKUService, private bomService: BomService, private articleService: ArticleService, private route: ActivatedRoute, private router: Router) {
  }

  get produits(): FormArray {
    return this.form.get('produits') as FormArray;
  }

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

  addProduit(productId: string = '', bomId: string = '', quantiteCible: number | null = null): void {
    const defaultQty = quantiteCible || this.form.get('quantiteCible')?.value;

    const produitGroup = this.fb.group({
      productId: [productId, Validators.required],
      bomId: [bomId, Validators.required],
      quantiteCible: [defaultQty, [Validators.required, Validators.min(1)]]
    });

    produitGroup.get('productId')?.valueChanges.subscribe(id => {
      if (id) {
        this.loadBomsForProduct(id, produitGroup);
      }
    });

    if (productId) {
      this.loadBomsForProduct(productId, produitGroup);
    }

    this.produits.push(produitGroup);
  }

  removeProduit(index: number): void {
    this.produits.removeAt(index);
    this.calculateSummary();
  }

  updateGlobalQuantity(): void {
    const globalQty = Number(this.form.get('quantiteCible')?.value || 0);

    if (globalQty > 0 && this.produits.length > 0) {
      this.produits.controls.forEach(control => {
        const prodControl = control.get('quantiteCible');

        if (prodControl && Number(prodControl.value || 0) !== globalQty) {
          prodControl.setValue(globalQty, {emitEvent: false});
        }
      });
    }
  }

  calculateSummary(): void {
    try {
      const summaryMap = new Map<string, {
        articleId: string; articleName: string; totalQuantity: number; unit: string;
      }>();

      this.produits.controls.forEach(control => {
        const productId = control.get('productId')?.value;
        const bomId = control.get('bomId')?.value;
        const qteCible = Number(control.get('quantiteCible')?.value || 0);

        if (!productId || !bomId || qteCible <= 0) {
          return;
        }

        const sku = this.skus.find(s => s.id === productId);
        const boms = this.productBoms[productId] || [];
        const selectedBom = boms.find(b => b.id === bomId);

        if (!selectedBom?.lines || !sku) {
          return;
        }

        const baseUnitCount = this.calculateBaseUnitCount(qteCible, sku);

        selectedBom.lines.forEach(line => {
          const article = this.articlesCache[line.articleId];

          if (!article) {
            this.loadArticleForCache(line.articleId);
          }

          const calculatedQuantity = this.calculateBomLineQuantity(baseUnitCount, line, article);
          const existing = summaryMap.get(line.articleId);

          if (existing) {
            existing.totalQuantity += calculatedQuantity;
          } else {
            summaryMap.set(line.articleId, {
              articleId: line.articleId,
              articleName: line.articleName || article?.nom || 'Article inconnu',
              totalQuantity: calculatedQuantity,
              unit: line.unitOfMeasure || article?.um || 'UNITÉ'
            });
          }
        });
      });

      this.bomSummary = Array.from(summaryMap.values());
    } catch (e) {
      console.error('Erreur lors du calcul du résumé', e);
      this.bomSummary = [];
    }
  }

  getCalculatedBomLines(productId: string, bomId: string, qteCible: number): any[] {
    const boms = this.productBoms[productId] || [];
    const bom = boms.find(b => b.id === bomId);

    if (!bom?.lines) {
      return [];
    }

    const sku = this.skus.find(s => s.id === productId);

    if (!sku) {
      return bom.lines;
    }

    const baseUnitCount = this.calculateBaseUnitCount(qteCible, sku);

    return bom.lines.map(line => {
      const article = this.articlesCache[line.articleId];
      const calculatedQuantity = this.calculateBomLineQuantity(baseUnitCount, line, article);

      return {
        ...line, calculatedQuantity
      };
    });
  }

  getBomLines(productId: string, bomId: string): any[] {
    const boms = this.productBoms[productId] || [];
    const bom = boms.find(b => b.id === bomId);

    return bom?.lines || [];
  }

  calculValeurTotale(): number {
    const qte = Number(this.form?.get('quantiteCible')?.value || 0);
    const prix = Number(this.form?.get('prixUnitaire')?.value || 0);

    return qte * prix;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      const invalidFields: string[] = [];

      Object.keys(this.form.controls).forEach(name => {
        if (this.form.controls[name].invalid) {
          invalidFields.push(name);
        }
      });

      console.error('Champs invalides:', invalidFields);
      alert('Veuillez remplir tous les champs obligatoires (Client, Produits, Date, Lignes, Prix, etc.).');
      return;
    }

    const selectedClient = this.getSelectedClient();

    if (!selectedClient) {
      this.form.get('clientId')?.setErrors({required: true});
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

      reservations: this.bomSummary.map(item => ({
        articleId: item.articleId, quantiteReservee: item.totalQuantity, statut: 'PRE-CALCULE'
      })),

      statut: formValue.statut
    };

    const action = this.isEdit && this.projetId ? this.projetService.update(this.projetId, request) : this.projetService.create(request);

    action.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['../'], {relativeTo: this.route});
      }, error: (err: unknown) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['../'], {relativeTo: this.route});
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

    const next = checked ? Array.from(new Set([...current, ligneId])) : current.filter(id => id !== ligneId);

    control?.setValue(next);
    control?.markAsTouched();
    control?.updateValueAndValidity();
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
      produits: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
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

  private calculateBaseUnitCount(qteCible: number, sku: SKU): number {
    const projectUnit = this.form.get('unite')?.value;

    if (projectUnit === 'LITRES' && sku.volume && sku.volume > 0) {
      return Math.ceil(qteCible / (sku.volume / 1000));
    }

    return Math.ceil(qteCible);
  }

  private calculateBomLineQuantity(baseUnitCount: number, line: any, article?: Article): number {
    let calculatedQuantity = baseUnitCount * Number(line.quantity || 0);

    if (!article?.configuration) {
      return Math.ceil(calculatedQuantity);
    }

    const config = article.configuration as any;

    if (article.categorie === 'COLIS' && config.unitsPerColis > 0) {
      calculatedQuantity = Math.ceil((baseUnitCount / config.unitsPerColis) * line.quantity);
    } else if (article.categorie === 'PALETTE') {
      const unitsPerPalette = this.calculateUnitsPerPalette(config);

      if (unitsPerPalette > 0) {
        calculatedQuantity = Math.ceil((baseUnitCount / unitsPerPalette) * line.quantity);
      } else {
        calculatedQuantity = Math.ceil(calculatedQuantity);
      }
    } else {
      calculatedQuantity = Math.ceil(calculatedQuantity);
    }

    return Math.ceil(calculatedQuantity);
  }

  private calculateUnitsPerPalette(config: any): number {
    if (!config?.colisPerLayer || !config?.numberOfLayers || !config?.colisId) {
      return 0;
    }

    const colisPerPalette = config.colisPerLayer * config.numberOfLayers;
    const colisArticle = this.articlesCache[config.colisId];
    const colisConfig = colisArticle?.configuration as any;

    if (!colisConfig?.unitsPerColis) {
      return 0;
    }

    return colisPerPalette * colisConfig.unitsPerColis;
  }

  private loadArticleForCache(articleId: string): void {
    if (!articleId || this.articlesCache[articleId]) {
      return;
    }

    this.articleService.getArticleById(articleId).subscribe({
      next: (article) => {
        this.articlesCache[articleId] = article;

        const config = article.configuration as any;

        if (article.categorie === 'PALETTE' && config?.colisId) {
          this.loadArticleForCache(config.colisId);
        }

        this.calculateSummary();
      }, error: (err) => {
        console.error('Erreur chargement article', err);
      }
    });
  }

  private loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data || [];
      }, error: (err: unknown) => {
        console.error('Erreur chargement clients', err);
        this.clients = [];
      }
    });
  }

  private loadLignes(): void {
    this.ligneService.getActiveLignes().subscribe({
      next: (data: LigneConditionnement[]) => {
        this.lignes = data || [];
      }, error: (err: unknown) => {
        console.error('Erreur chargement lignes', err);
        this.lignes = [];
      }
    });
  }

  private loadSkus(): void {
    this.skuService.getAllProducts().subscribe({
      next: (data: SKU[]) => {
        this.skus = data || [];
      }, error: (err: unknown) => {
        console.error('Erreur chargement SKUs', err);
        this.skus = [];
      }
    });
  }

  private loadBomsForProduct(productId: string, control?: FormGroup): void {
    if (!this.productBoms[productId]) {
      this.bomService.getBomsByProduct(productId).subscribe({
        next: (boms) => {
          this.productBoms[productId] = boms || [];

          this.productBoms[productId].forEach(bom => {
            bom.lines?.forEach(line => this.loadArticleForCache(line.articleId));
          });

          this.autoSelectBom(productId, control);
          this.calculateSummary();
        }, error: (err) => {
          console.error('Erreur chargement BOMs pour produit', err);
        }
      });

      return;
    }

    this.autoSelectBom(productId, control);
  }

  private autoSelectBom(productId: string, control?: FormGroup): void {
    if (!control || !this.productBoms[productId]?.length) {
      return;
    }

    const currentBomId = control.get('bomId')?.value;

    if (!currentBomId) {
      control.get('bomId')?.setValue(this.productBoms[productId][0].id);
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
          this.addProduit(projet.productId, projet.bomId, projet.quantiteCible);
        }

        this.valeurTotaleEstimee = this.calculValeurTotale();
        this.calculateSummary();
      }, error: (err: unknown) => {
        console.error('Erreur chargement projet', err);
      }
    });
  }

  private getSelectedClient(): Client | undefined {
    const clientId = this.form.get('clientId')?.value;
    return this.clients.find(client => client.id === clientId);
  }

}
