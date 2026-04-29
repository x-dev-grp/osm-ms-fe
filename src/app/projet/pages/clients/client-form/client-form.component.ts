import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ClientService } from '../../../services/ClientService';

@Component({
  selector: 'app-client-form',
  standalone: true,
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ClientFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  clientId: string | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.clientId = this.route.snapshot.paramMap.get('id');

    if (this.clientId) {
      this.isEdit = true;
      this.loadClient();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      type: ['BUYER', Validators.required],
      adresse: ['']
    });
  }

  loadClient(): void {
    if (!this.clientId) return;

    this.loading = true;
    this.errorMessage = '';

    this.clientService.getById(this.clientId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: any) => {
          const client = response?.data ?? response;
          if (!client) {
            this.errorMessage = 'Client introuvable.';
            return;
          }
          this.form.patchValue({
            nom: client.nom ?? '',
            email: client.email ?? '',
            telephone: client.telephone ?? '',
            type: client.type ?? 'BUYER',
            adresse: client.adresse ?? ''
          });
        },
        error: (err) => {
          console.error('Erreur chargement client:', err);
          this.errorMessage = err?.error?.message || 'Erreur lors du chargement du client.';
        }
      });
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.loading) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const request = {
      nom: this.form.value.nom?.trim(),
      email: this.form.value.email?.trim(),
      telephone: this.form.value.telephone?.trim(),
      type: this.form.value.type,
      adresse: this.form.value.adresse?.trim() || ''
    };

    const action$ = this.isEdit && this.clientId
      ? this.clientService.update(this.clientId, request)
      : this.clientService.create(request);

    action$
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response: any) => {
          console.log('Client sauvegardé avec succès:', response);
          this.router.navigate(['/projets/clients']);
        },
        error: (err) => {
          console.error('Erreur sauvegarde client:', err);
          this.errorMessage =
            err?.error?.message ||
            err?.error?.error ||
            'Erreur lors de l’enregistrement du client.';
        }
      });
  }

  onCancel(): void {
    if (this.loading) return;
    this.router.navigate(['/projets/clients']);
  }

  get f() {
    return this.form.controls;
  }
}
