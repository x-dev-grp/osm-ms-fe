import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ClientService } from '../../../services/client.service';
import { Client, ClientType } from '../../../models/client.model';
import { ApiResponse } from '../../../../shared/models/api-response';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss']
})
export class ClientFormComponent implements OnInit {
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
      next: (response: ApiResponse<Client>) => {
        if (response.success && response.data && response.data.length > 0) {
          const client = response.data[0];

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
        } else {
          this.error = response.message || 'Client non trouvé';
          setTimeout(() => this.router.navigate(['/stock/clients']), 2000);
        }
      },
      error: (err) => {
        console.error('Erreur chargement client', err);
        this.error = 'Impossible de charger le client';
        setTimeout(() => this.router.navigate(['/stock/clients']), 2000);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = null;

    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const client: Client = {
      ...this.clientForm.value,
      type: this.clientForm.value.type ?? ClientType.BUYER
    };

    if (this.isEditMode) {
      this.clientService.updateClient(this.clientId!, client).subscribe({
        next: (response: ApiResponse<Client>) => {
          if (response.success) {
            this.successMessage = 'Client mis à jour avec succès';
            setTimeout(() => {
              this.router.navigate(['/stock/clients', this.clientId]);
            }, 1500);
          } else {
            this.error = response.message || 'Erreur lors de la mise à jour';
            this.submitting = false;
          }
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          this.submitting = false;
        }
      });
    } else {
      this.clientService.createClient(client).subscribe({
        next: (response: ApiResponse<Client>) => {
          if (response.success && response.data && response.data.length > 0) {
            const created = response.data[0];
            this.successMessage = 'Client créé avec succès';
            setTimeout(() => {
              this.router.navigate(['/stock/clients', created.id]);
            }, 1500);
          } else {
            this.error = response.message || 'Erreur lors de la création';
            this.submitting = false;
          }
        },
        error: (err) => {
          console.error('Erreur création', err);
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
