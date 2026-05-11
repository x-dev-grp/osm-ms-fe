import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProjetDto, TypeEmballage, TypeProduit } from '../../../models/TypeProduit';
import {Client, ClientType} from '../../../models/client.model';
import { ProjetService } from '../../../services/projet.service';
import { ClientService } from '../../../services/client.service';

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

  private loadProjet(): void {
    if (!this.projetId) {
      return;
    }

    this.projetService.getById(this.projetId).subscribe({
      next: (projet: ProjetDto) => {
        this.projetCode = projet.code;

        this.form.patchValue({
          clientId: projet.client?.id ?? '',
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

    const request: ProjetDto = {
      id: this.projetId ?? '',
      code: this.projetCode,

      client: selectedClient,

      typeProduit: formValue.typeProduit,
      typeEmballage: formValue.typeEmballage,

      quantiteCible: Number(formValue.quantiteCible),
      unite: formValue.unite,

      dateLimiteLivraison: formValue.dateLimiteLivraison,
      prixUnitaire: Number(formValue.prixUnitaire),
      valeurTotale: this.calculValeurTotale(),

      conditionsLivraison: formValue.conditionsLivraison,

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

  private getSelectedClient(): Client | undefined {
    const clientId = this.form.get('clientId')?.value;

    return this.clients.find((client) => client.id === clientId);
  }

  protected readonly ClientType = ClientType;
}
