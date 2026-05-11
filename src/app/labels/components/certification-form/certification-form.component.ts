import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Certification } from '../../models/certification.model';

@Component({
  selector: 'app-certification-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifier' : 'Ajouter' }} une Certification</h2>
    <mat-dialog-content>
      <form [formGroup]="certForm" class="cert-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="name" placeholder="ex: Agriculture Biologique">
            <mat-error *ngIf="certForm.get('name')?.hasError('required')">Le nom est requis</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="ex: BIO">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Organisme certificateur</mat-label>
            <input matInput formControlName="issuingBody" placeholder="ex: Ecocert">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Catégorie</mat-label>
            <mat-select formControlName="category">
              <mat-option value="LEGAL">Légale</mat-option>
              <mat-option value="MARKETING">Marketing</mat-option>
              <mat-option value="QUALITY">Qualité</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="logo-section">
          <label class="section-label">Logo de la certification</label>
          <div class="logo-upload-box shadow-premium" 
               [class.dragging]="isDragging"
               (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)">
             <img *ngIf="logoPreview" [src]="logoPreview" class="preview-img" />
             <div *ngIf="!logoPreview" class="upload-placeholder">
                <mat-icon>{{ isDragging ? 'download' : 'cloud_upload' }}</mat-icon>
                <span>{{ isDragging ? 'Déposez le fichier ici' : 'Cliquer pour uploader le logo' }}</span>
                <small>PNG, JPG (max 200KB)</small>
             </div>
             <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" style="display: none">
          </div>
          <button mat-button color="warn" *ngIf="logoPreview" (click)="removeLogo($event)" class="mt-1">
            <mat-icon>delete</mat-icon> Supprimer le logo
          </button>
        </div>

        <mat-form-field appearance="outline" class="full-width mt-2">
          <mat-label>Site Web</mat-label>
          <input matInput formControlName="websiteUrl" placeholder="https://...">
        </mat-form-field>

        <div class="form-row status-row">
           <label>Statut : </label>
           <mat-select formControlName="isActive" style="width: 150px; margin-left: 10px;">
             <mat-option [value]="true">Actif</mat-option>
             <mat-option [value]="false">Inactif</mat-option>
           </mat-select>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" [disabled]="certForm.invalid" (click)="onSave()">
        {{ isEdit ? 'Mettre à jour' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cert-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 10px;
      min-width: 500px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      & > * { flex: 1; }
    }
    .full-width {
      width: 100%;
    }
    .status-row {
      align-items: center;
      margin-top: 8px;
    }
    .logo-section {
      display: flex;
      flex-direction: column;
      margin: 16px 0;
    }
    .section-label {
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 8px;
    }
    .logo-upload-box {
      width: 100%;
      height: 120px;
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.2s;
      &:hover, &.dragging {
        border-color: #3b82f6;
        background: #eff6ff;
      }
      &.dragging {
        border-style: solid;
        transform: scale(1.02);
      }
    }
    .preview-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #9ca3af;
      mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; }
      span { font-size: 13px; font-weight: 500; }
      small { font-size: 11px; }
    }
    .mt-1 { margin-top: 8px; }
    .mt-2 { margin-top: 16px; }
    .shadow-premium {
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
  `]
})
export class CertificationFormComponent implements OnInit {
  certForm: FormGroup;
  isEdit = false;
  logoPreview: string | null = null;
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CertificationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Certification
  ) {
    this.isEdit = !!data?.id;
    this.certForm = this.fb.group({
      id: [data?.id],
      name: [data?.name || '', Validators.required],
      code: [data?.code || ''],
      description: [data?.description || ''],
      issuingBody: [data?.issuingBody || ''],
      logoData: [data?.logoData || ''],
      logoContentType: [data?.logoContentType || ''],
      websiteUrl: [data?.websiteUrl || ''],
      category: [data?.category || 'MARKETING'],
      isActive: [data?.isActive ?? true]
    });

    if (data?.logoData && data?.logoContentType) {
      this.logoPreview = `data:${data.logoContentType};base64,${data.logoData}`;
    }
  }

  ngOnInit(): void {}

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    this.handleFile(file);
  }

  private handleFile(file: File | undefined): void {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
        const base64Content = (reader.result as string).split(',')[1];
        this.certForm.patchValue({
          logoData: base64Content,
          logoContentType: file.type
        });
        this.certForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(event: Event): void {
    event.stopPropagation();
    this.logoPreview = null;
    this.certForm.patchValue({
      logoData: '',
      logoContentType: ''
    });
    this.certForm.markAsDirty();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.certForm.valid) {
      this.dialogRef.close(this.certForm.value);
    }
  }
}
