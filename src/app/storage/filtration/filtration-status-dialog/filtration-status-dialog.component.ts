import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { switchMap } from 'rxjs';

import { FiltrationApiService } from '../../../shared/services/filtration-api.service';
import { FiltrationOperation } from '../../../shared/models/filtration-operation';
import { FILTRATION_STATUS_LABEL, FiltrationStatus } from '../../../shared/models/filtration-status';
import { ToastService } from '../../../shared/services/toast.service';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error.util';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-filtration-status-dialog',
  templateUrl: './filtration-status-dialog.component.html',
  styleUrls: ['./filtration-status-dialog.component.scss'],
  imports: [
    TranslateModule,
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

  readonly label = FILTRATION_STATUS_LABEL;

  form = this.fb.group({
    status: ['CREATED' as FiltrationStatus, Validators.required],
    note: [''],
    volumeAfter: [null as number | null]
  });

  constructor(
    private fb: FormBuilder,
    private api: FiltrationApiService,
    private toast: ToastService,
    private ref: MatDialogRef<FiltrationStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { row: FiltrationOperation }
  ) {
    const allowed = this.allowedStatuses();
    if (allowed.length > 0) {
      const preferred = allowed.includes('COMPLETED') ? 'COMPLETED' : allowed[0];
      this.form.patchValue({
        status: preferred,
        volumeAfter: preferred === 'COMPLETED' ? (data.row.volumeFiltered ?? null) : null
      });

      if (preferred === 'COMPLETED') {
        this.form.get('volumeAfter')?.setValidators([Validators.required, Validators.min(0)]);
        this.form.get('volumeAfter')?.updateValueAndValidity();
      }
    }
  }

  get dialogTitle(): string {
    const current = this.data.row.status as FiltrationStatus;
    if (current === 'IN_PROGRESS' || this.allowedStatuses().includes('COMPLETED')) {
      return 'Terminer la filtration';
    }
    return 'Changer le statut';
  }

  get currentStatusLabel(): string {
    return this.statusLabel(this.data.row.status as FiltrationStatus);
  }

  statusLabel(status: FiltrationStatus): string {
    return this.label[status] ?? status;
  }

  ngOnInit() {
    // Ajouter les validateurs dynamiquement quand le statut change
    this.form.get('status')?.valueChanges.subscribe((status) => {
      const volumeAfterControl = this.form.get('volumeAfter');

      if (status === 'COMPLETED') {
        volumeAfterControl?.setValidators([Validators.required, Validators.min(0)]);
        if (volumeAfterControl?.value == null && this.data.row.volumeFiltered != null) {
          volumeAfterControl?.setValue(this.data.row.volumeFiltered);
        }
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
        return ['IN_PROGRESS', 'COMPLETED'];
      case 'IN_PROGRESS':
        return ['COMPLETED'];
      case 'COMPLETED':
      case 'CANCELLED':
      default:
        return [];
    }
  }

  isCompleteSelected(): boolean {
    return this.form.get('status')?.value === 'COMPLETED';
  }

  showsCompleteHint(): boolean {
    return this.isCompleteSelected() && this.data.row.status === 'CREATED';
  }

  private handleError(error: unknown, fallback: string): void {
    this.toast.error(extractHttpErrorMessage(error, fallback));
    this.loading = false;
  }

  save(): void {
    // Vérifier si le formulaire est valide
    if (this.form.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.form.controls).forEach((key) => {
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
        error: (error) => this.handleError(error, 'Impossible de demarrer la filtration')
      });
      return;
    }

    // CREATED -> COMPLETED (demarrer puis terminer)
    if (currentStatus === 'CREATED' && newStatus === 'COMPLETED') {
      const volumeAfter = this.form.get('volumeAfter')?.value;

      if (volumeAfter === null || volumeAfter === undefined || volumeAfter < 0) {
        this.loading = false;
        this.form.get('volumeAfter')?.markAsTouched();
        return;
      }

      this.api
        .start(op.operationId)
        .pipe(
          switchMap(() =>
            this.api.complete(op.operationId, {
              volumeAfter: Number(volumeAfter),
              note: note || undefined
            })
          )
        )
        .subscribe({
          next: () => this.ref.close(true),
          error: (error) => this.handleError(error, 'Impossible de terminer la filtration')
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

      this.api
        .complete(op.operationId, {
          volumeAfter: Number(volumeAfter),
          note: note || undefined
        })
        .subscribe({
          next: () => this.ref.close(true),
          error: (error) => this.handleError(error, 'Impossible de terminer la filtration')
        });
      return;
    }

    this.loading = false;
  }

  close(): void {
    this.ref.close(false);
  }
}
