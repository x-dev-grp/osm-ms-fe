import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ClientService } from '../../../services/client.service';
import { Client, ClientType } from '../../../models/client.model';
import { ApiResponse } from '../../../../shared/models/api-response';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss']
})
export class ClientFormComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  readonly ClientType = ClientType;

  clientForm: FormGroup;
  isEditMode = false;
  clientId?: string;
  submitted = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {
    this.clientForm = this.fb.group({
      nom: ['', Validators.required],
      type: [ClientType.BUYER, Validators.required],
      codeClient: [''],
      email: ['', [Validators.email]],
      telephone: [''],
      adresse: [''],
      ville: [''],
      pays: [''],
      codePostal: [''],
      privateLabel: [false],
      siret: [''],
      numeroTva: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.clientId;

    if (this.isEditMode) {
      this.loadClient();
    }
  }

  loadClient(): void {
    this.clientService.getClientById(this.clientId!).subscribe({
      next: (client) => {
        this.clientForm.patchValue({
            nom: client.nom,
            type: client.type ?? ClientType.BUYER,
            codeClient: client.codeClient || '',
            email: client.email || '',
            telephone: client.telephone || '',
            adresse: client.adresse || '',
            ville: client.ville || '',
            pays: client.pays || '',
            codePostal: client.codePostal || '',
            privateLabel: client.privateLabel ?? false,
            siret: client.siret || '',
            numeroTva: client.numeroTva || '',
            notes: client.notes || ''
          });
      },
      error: (err) => {
        console.error('Erreur chargement client', err);
        this.error = 'Impossible de charger le client';
        setTimeout(() => this.router.navigate(['/stock/clients']), 2000);
      }
    });
  }

  onSubmit(): void {
    alert(this.i18n.instant('AUTO.BOUTON_CLIQUE_VALIDATION_DU_FORMULAIRE'));
    this.submitted = true;
    this.error = null;

    if (this.clientForm.invalid) {
      alert(this.i18n.instant('AUTO.LE_FORMULAIRE_EST_INVALIDE_VERIFIEZ_LES_CHAMPS_OBLIGATOIRES_EX_N'));
      this.error = "Veuillez remplir correctement tous les champs obligatoires.";
      this.clientForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formValue = this.clientForm.value;
    const client: Client = {
      ...formValue,
      type: formValue.type ?? ClientType.BUYER,
      codeClient: formValue.codeClient?.trim() || undefined,
      email: formValue.email?.trim() || undefined
    };

    alert(this.i18n.instant('AUTO.ENVOI_EN_COURS_VERS_LE_SERVEUR'));

    if (this.isEditMode) {
      this.clientService.updateClient(this.clientId!, client).subscribe({
        next: () => {
          this.successMessage = this.i18n.instant('CUSTOMERS.MESSAGES.UPDATE_SUCCESS');
          setTimeout(() => {
            this.router.navigate(['/stock/clients', this.clientId]);
          }, 1500);
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          this.submitting = false;
        }
      });
    } else {
      this.clientService.createClient(client).subscribe({
        next: (created) => {
          this.successMessage = this.i18n.instant('CUSTOMERS.MESSAGES.SAVE_SUCCESS');
          setTimeout(() => {
            this.router.navigate(['/stock/clients', created.id]);
          }, 1500);
        },
        error: (err) => {
          console.error('Erreur création', err);
          alert(this.i18n.instant('AUTO.ERREUR_DU_SERVEUR') + (err.error?.message || err.message || this.i18n.instant('AUTO.ERREUR_INCONNUE')));
          this.error = err.error?.message || 'Erreur lors de la création';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/stock/clients', this.clientId]);
    } else {
      this.router.navigate(['/stock/clients']);
    }
  }

  get f() {
    return this.clientForm.controls;
  }
}
