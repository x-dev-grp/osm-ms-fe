import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CertificationService } from '../../services/certification.service';
import { Certification } from '../../models/certification.model';
import { CertificationFormComponent } from '../certification-form/certification-form.component';

@Component({
  selector: 'app-certification-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatChipsModule, MatDialogModule],
  templateUrl: './certification-detail.component.html',
  styleUrls: ['./certification-detail.component.scss']
})
export class CertificationDetailComponent implements OnInit {
  certification?: Certification;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certService: CertificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCertification(id);
    }
  }

  loadCertification(id: string): void {
    this.certService.getById(id).subscribe({
      next: (data) => {
        this.certification = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  openEditForm(): void {
    if (!this.certification) return;
    
    const dialogRef = this.dialog.open(CertificationFormComponent, {
      width: '600px',
      data: this.certification
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.certService.update(result).subscribe(() => {
          this.loadCertification(this.certification!.id!);
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/labels/certifications']);
  }

  viewLargeLogo(): void {
    if (!this.certification?.logoData) return;
    
    this.dialog.open(ImagePreviewDialog, {
      data: {
        image: `data:${this.certification.logoContentType};base64,${this.certification.logoData}`,
        name: this.certification.name
      },
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'premium-preview-dialog'
    });
  }
}

@Component({
  selector: 'image-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="preview-dialog-container">
      <div class="preview-header">
        <h3>{{ data.name }}</h3>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>
      <div class="preview-body">
        <img [src]="data.image" [alt]="data.name">
      </div>
    </div>
  `,
  styles: [`
    .preview-dialog-container { padding: 20px; display: flex; flex-direction: column; gap: 16px; background: white; border-radius: 20px; }
    .preview-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f1f1; padding-bottom: 12px; }
    .preview-header h3 { margin: 0; color: #3d4a2a; font-family: 'Outfit', sans-serif; }
    .preview-body { display: flex; justify-content: center; align-items: center; overflow: auto; max-height: 80vh; }
    .preview-body img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  `]
})
export class ImagePreviewDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { image: string, name: string }) {}
}

import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
