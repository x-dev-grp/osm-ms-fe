import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { FiltrationStatus, FILTRATION_STATUS_LABEL } from '../../../shared/models/filtration-status';
import { MatOption } from "@angular/material/core";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { MatSelect } from "@angular/material/select";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatInput } from "@angular/material/input";
import { MatButton } from "@angular/material/button";

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
export class FiltrationStatusDialogComponent implements OnInit {
  loading = false;

  readonly statuses: FiltrationStatus[] = ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  readonly label = FILTRATION_STATUS_LABEL;

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
    const allowed = this.allowedStatuses();
    if (allowed.length > 0) {
      this.form.patchValue({ status: allowed[0] });
    }
  }

  ngOnInit() {
    // Ajouter les validateurs dynamiquement quand le statut change
    this.form.get('status')?.valueChanges.subscribe(status => {
      const volumeAfterControl = this.form.get('volumeAfter');

      if (status === 'COMPLETED') {
        volumeAfterControl?.setValidators([Validators.required, Validators.min(0)]);
      } else {
        volumeAfterControl?.clearValidators();
        volumeAfterControl?.setValue(null);
      }
      volumeAfterControl?.updateValueAndValidity();
    });
  }

  allowedStatuses(): FiltrationStatus[] {
    const current = this.data.row.status as FiltrationStatus;

    switch (current) {
      case 'CREATED':
        return ['IN_PROGRESS'];
      case 'IN_PROGRESS':
        return ['COMPLETED', 'CANCELLED'];
      case 'COMPLETED':
      case 'CANCELLED':
      default:
        return [];
    }
  }

  //renvoi true si l'utilisateur
  isCompleteSelected(): boolean {
    return this.form.get('status')?.value === 'COMPLETED';
  }

  save(): void {
    // Vérifier si le formulaire est valide
    if (this.form.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const op = this.data.row;
    const currentStatus = op.status as FiltrationStatus;
    const newStatus = this.form.get('status')?.value as FiltrationStatus;
    const note = (this.form.get('note')?.value ?? '').trim();
    const allowed = this.allowedStatuses();

    // Blocage si aucun changement n'est autorisé
    if (allowed.length === 0) {
      this.ref.close(false);
      return;
    }

    // Blocage si le statut sélectionné n'est pas autorisé
    if (!allowed.includes(newStatus)) {
      return;
    }

    this.loading = true;

    // CREATED -> IN_PROGRESS
    if (currentStatus === 'CREATED' && newStatus === 'IN_PROGRESS') {
      this.api.start(op.operationId).subscribe({
        next: () => this.ref.close(true),
        error: (error) => {
          console.error('Erreur:', error);
          this.loading = false;
        },
      });
      return;
    }

    // IN_PROGRESS -> COMPLETED
    if (currentStatus === 'IN_PROGRESS' && newStatus === 'COMPLETED') {
      const volumeAfter = this.form.get('volumeAfter')?.value;

      if (volumeAfter === null || volumeAfter === undefined || volumeAfter < 0) {
        this.loading = false;
        this.form.get('volumeAfter')?.markAsTouched();
        return;
      }

      this.api.complete(op.operationId, {
        volumeAfter: Number(volumeAfter),
        note: note || undefined,
      }).subscribe({
        next: () => this.ref.close(true),
        error: (error) => {
          console.error('Erreur:', error);
          this.loading = false;
        },
      });
      return;
    }

    // IN_PROGRESS -> CANCELLED
    if (currentStatus === 'IN_PROGRESS' && newStatus === 'CANCELLED') {
      this.api.updateStatus(op.operationId, {
        status: newStatus,
        note: note || undefined,
      }).subscribe({
        next: () => this.ref.close(true),
        error: (error) => {
          console.error('Erreur:', error);
          this.loading = false;
        },
      });
      return;
    }

    this.loading = false;
  }

  close(): void {
    this.ref.close(false);
  }
}
