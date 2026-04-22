import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProjetService } from '../../../services/projet.service';
import { ClientService } from "../../../services/ClientService";

import { Client } from "../../../models/Client";
import { ProjetDto, TypeEmballage, TypeProduit } from "../../../models/TypeProduit";

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
  typeProduits: TypeProduit[] = Object.values(TypeProduit);
  typeEmballages: TypeEmballage[] = Object.values(TypeEmballage);
  unites: Array<'LITRES' | 'UNITES'> = ['LITRES', 'UNITES'];

  isEdit = false;
  projetId: string | null = null;
  loading = false;
  valeurTotaleEstimee = 0;

  // Correction: affichage du code projet retourne par le back
  projetCode?: string;

  constructor(
    private fb: FormBuilder,
    private projetService: ProjetService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.listenValeurTotale();
    this.loadClients();

    this.projetId = this.route.snapshot.paramMap.get('id');
    if (this.projetId) {
      this.isEdit = true;
      this.loadProjet();
    }
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
      statut: ['BROUILLON']
    });
  }

  private listenValeurTotale(): void {
    this.form.valueChanges.subscribe(() => {
      this.valeurTotaleEstimee = this.calculValeurTotale();
    });

    this.valeurTotaleEstimee = this.calculValeurTotale();
  }

  private loadClients(): void {
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients = data || [];
      },
      error: (err) => {
        console.error('Erreur chargement clients', err);
        this.clients = [];
      }
    });
  }

  private loadProjet(): void {
    if (!this.projetId) return;

    this.projetService.getById(this.projetId).subscribe({
      next: (projet) => {
        // Correction: recuperation du code genere cote backend
        this.projetCode = projet.code;

        this.form.patchValue({
          clientId: projet.clientId,
          typeProduit: projet.typeProduit,
          typeEmballage: projet.typeEmballage,
          quantiteCible: projet.quantiteCible,
          unite: projet.unite,
          dateLimiteLivraison: projet.dateLimiteLivraison,
          prixUnitaire: projet.prixUnitaire,
          conditionsLivraison: projet.conditionsLivraison,
          statut: projet.statut ?? 'BROUILLON'
        });

        this.valeurTotaleEstimee = this.calculValeurTotale();
      },
      error: (err) => {
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
      return;
    }

    this.loading = true;

    const request: ProjetDto = {
      ...this.form.value
    };

    const action = this.isEdit && this.projetId
      ? this.projetService.update(this.projetId, request)
      : this.projetService.create(request);

    action.subscribe({
      next: (saved) => {
        this.loading = false;

        //on recupere le code genere apres creation
        this.projetCode = saved.code;

        this.router.navigate(['/projets']);
      },
      error: (err) => {
        console.error('Erreur enregistrement projet', err);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/projets']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }
}
