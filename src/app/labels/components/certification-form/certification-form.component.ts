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
  templateUrl: './certification-form.component.html',
  styleUrls: ['./certification-form.component.scss']
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
