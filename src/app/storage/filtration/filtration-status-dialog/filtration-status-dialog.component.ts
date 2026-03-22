import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { FiltrationStatus, FILTRATION_STATUS_LABEL } from '../../../shared/models/filtration-status';
import {MatOption} from "@angular/material/core";
import {MatFormField, MatHint, MatLabel} from "@angular/material/form-field";
import {MatSelect} from "@angular/material/select";
import {MatIcon} from "@angular/material/icon";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatInput} from "@angular/material/input";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-filtration-status-dialog',
  templateUrl: './filtration-status-dialog.component.html',
  styleUrls: ['./filtration-status-dialog.component.scss'],
  imports: [
    CommonModule,
    MatOption,
    MatFormField,
    MatLabel,
    MatHint,
    MatSelect,
    ReactiveFormsModule,
    MatIcon,
    MatProgressSpinner,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatInput
  ]
})
export class FiltrationStatusDialogComponent {
  // True pendant l’appel API.
  loading = false;

  // Statuts proposés dans le select.
  readonly statuses: FiltrationStatus[] = ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  readonly label = FILTRATION_STATUS_LABEL;

  // Formulaire:
  // - status obligatoire
  // - note optionnelle
  // - volumeAfter visible/obligatoire uniquement si COMPLETED
  form = this.fb.group({
    status: ['CREATED' as FiltrationStatus, Validators.required],
    note: [''],
    volumeAfter: [null as number | null],
  });

  constructor(
    private fb: FormBuilder,
    private api: FiltrationApiService,
    private ref: MatDialogRef<FiltrationStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row: FiltrationOperation }
  ) {
    // On initialise le statut sur la valeur actuelle.
    this.form.patchValue({ status: data.row.status as FiltrationStatus });
  }

  // Permet d’afficher le champ volumeAfter seulement si COMPLETED est sélectionné.
  isCompleteSelected(): boolean {
    return this.form.value.status === 'COMPLETED';
  }

  // Sauvegarde:
  // - COMPLETED => endpoint /complete (volumeAfter requis)
  // - Sinon => endpoint /status
  save(): void {
    const op = this.data.row;
    const status = this.form.value.status as FiltrationStatus;
    const note = (this.form.value.note ?? '').trim();

    this.loading = true;

    if (status === 'COMPLETED') {
      const volumeAfter = this.form.value.volumeAfter;

      // Validation simple côté UI.
      if (volumeAfter == null || volumeAfter < 0) {
        this.loading = false;
        return;
      }

      this.api.complete(op.operationId, { volumeAfter, note }).subscribe({
        next: () => this.ref.close(true),
        error: () => (this.loading = false),
      });
      return;
    }

    this.api.updateStatus(op.operationId, { status, note: note || undefined }).subscribe({
      next: () => this.ref.close(true),
      error: () => (this.loading = false),
    });
  }

  // Ferme sans changement.
  close(): void {
    this.ref.close(false);
  }
}
