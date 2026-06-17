import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { ProjetDto } from '../../../models/TypeProduit';
import { TranslateModule } from '@ngx-translate/core';

export interface ProjetStatusDialogData {
  projet: ProjetDto;
}

export interface ProjetStatusDialogResult {
  status: 'EN_COURS' | 'VALIDE' | 'ANNULE';
  note: string;
}

type NormalizedStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | '';

@Component({
  selector: 'app-projet-status-dialog',
  standalone: true,
  imports: [TranslateModule, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  templateUrl: './projet-status-dialog.component.html',
  styleUrls: ['./projet-status-dialog.component.scss']
})
export class ProjetStatusDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProjetStatusDialogComponent, ProjetStatusDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ProjetStatusDialogData
  ) {
    this.form = this.fb.group({
      newStatus: [null, Validators.required],
      note: ['']
    });

    const availableStatuses = this.getAvailableStatuses();
    if (availableStatuses.length > 0) {
      this.form.patchValue({
        newStatus: availableStatuses[0].value
      });
    }
  }

  normalizeStatus(statut?: string): NormalizedStatus {
    const value = (statut ?? '').trim().toUpperCase();

    if (value === 'CREATED' || value === 'BROUILLON') return 'CREATED';
    if (value === 'IN_PROGRESS' || value === 'EN_COURS') return 'IN_PROGRESS';
    if (value === 'COMPLETED' || value === 'VALIDE' || value === 'ACCEPTE') return 'COMPLETED';
    if (value === 'CANCELLED' || value === 'ANNULE') return 'CANCELLED';

    return '';
  }

  getProjetLabel(): string {
    return this.data?.projet?.code || this.data?.projet?.client.nom || '-';
  }

  getCurrentStatusLabel(): string {
    const status = this.normalizeStatus(this.data?.projet?.statut);

    switch (status) {
      case 'CREATED':
        return 'Brouillon';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'COMPLETED':
        return 'Valide';
      case 'CANCELLED':
        return 'Annule';
      default:
        return this.data?.projet?.statut || '-';
    }
  }

  getAvailableStatuses(): Array<{ value: 'EN_COURS' | 'VALIDE' | 'ANNULE'; label: string }> {
    const current = this.normalizeStatus(this.data?.projet?.statut);

    if (current === 'CREATED') {
      return [
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'ANNULE', label: 'Annule' }
      ];
    }

    if (current === 'IN_PROGRESS') {
      return [
        { value: 'VALIDE', label: 'Valide' },
        { value: 'ANNULE', label: 'Annule' }
      ];
    }

    return [];
  }

  hasAvailableStatuses(): boolean {
    return this.getAvailableStatuses().length > 0;
  }

  canSubmit(): boolean {
    return this.hasAvailableStatuses() && this.form.valid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const result: ProjetStatusDialogResult = {
      status: this.form.get('newStatus')?.value as 'EN_COURS' | 'VALIDE' | 'ANNULE',
      note: (this.form.get('note')?.value ?? '').trim()
    };

    this.dialogRef.close(result);
  }
}
