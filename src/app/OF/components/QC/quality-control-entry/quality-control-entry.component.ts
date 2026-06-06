import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from 'src/app/shared/services/toast.service';
import { OFService } from '../../../services/OFService';
import { QCControlPoint } from '../../../models/QCControlPoint.model';
import { OrdreFabrication } from '../../../models/of.model';
import { SharedModule } from '../../../../shared/shared.module';
import { QualityService } from '../../../services/QualityService';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-quality-control-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    SharedModule
  ],
  templateUrl: './quality-control-entry.component.html',
  styleUrls: ['./quality-control-entry.component.scss']
})
export class QualityControlEntryComponent implements OnInit {
  ofs: OrdreFabrication[] = [];
  selectedOfId: string | null = null;
  selectedOfCode: string | null = null;
  points: QCControlPoint[] = [];
  qcForm: FormGroup;
  photosBase64: Record<string, string> = {};
  signatureText: string = '';

  constructor(
    private fb: FormBuilder,
    private qualityService: QualityService,
    private ofService: OFService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    this.qcForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadOFs();
    this.route.queryParams.subscribe(params => {
      const ofId = params['ofId'];
      if (ofId) {
        this.selectedOfId = ofId;
        if (this.ofs.length > 0) {
          this.onOfSelected();
        } else {
          const sub = this.ofService.getAll().subscribe({
            next: (data) => {
              this.ofs = data;
              sub.unsubscribe();
              this.onOfSelected();
            },
            error: () => this.toast.error('Erreur chargement OF')
          });
        }
      }
    });
  }

  loadOFs(): void {
    this.ofService.getAll().subscribe({
      next: (data) => this.ofs = data,
      error: () => this.toast.error('Erreur chargement OF')
    });
  }

  onOfSelected(): void {
    if (!this.selectedOfId) return;
    const selectedOf = this.ofs.find(of => of.id === this.selectedOfId);
    this.selectedOfCode = selectedOf?.code || null;

    this.qualityService.getPointsForOF(this.selectedOfId).subscribe({
      next: (res) => {
        if (res.success) {
          // @ts-ignore
          this.points = (res.data as QCControlPoint[]) || [];
          this.photosBase64 = {};
          this.buildForm();
        } else {
          this.toast.error(res.message || 'Aucun point actif');
        }
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erreur lors du chargement des points');
      }
    });
  }

  buildForm(): void {
    const controls: Record<string, any> = {};
    this.points.forEach(point => {
      if (!point.id) return;
      controls[`val_${point.id}`] = ['', Validators.required];
      controls[`commentaire_${point.id}`] = [''];
    });
    this.qcForm = this.fb.group(controls);
  }

  takePhoto(pointId: string | undefined): void {
    if (!pointId) return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        this.photosBase64[pointId] = ev.target.result.split(',')[1];
        this.toast.info('Photo ajoutée');
      };
      reader.readAsDataURL(file);
    };
    fileInput.click();
  }

  submit(): void {
    if (this.qcForm.invalid || !this.selectedOfId) return;

    const results: any[] = [];

    for (const point of this.points) {
      if (!point.id) continue;

      const value = this.qcForm.get(`val_${point.id}`)?.value;
      let statut = 'OK';

      if (point.type === 'NUMERIC') {
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal < point.minValue! || numVal > point.maxValue!) {
          statut = 'NOK';
        }
      } else if (point.type === 'BOOLEAN') {
        if (value !== 'OK') statut = 'NOK';
      }

      results.push({
        controlPointId: point.id,
        ofId: this.selectedOfId,
        valeur: String(value),
        statut: statut,
        commentaire: this.qcForm.get(`commentaire_${point.id}`)?.value || '',
        photo: this.photosBase64[point.id] || null,
        signature: this.signatureText
      });
    }

    let okCount = 0;
    const total = results.length;

    for (const result of results) {
      this.qualityService.submitResult(result).subscribe({
        next: () => {
          okCount++;
          if (okCount === total) {
            this.toast.success('Contrôle qualité enregistré');
            if (this.selectedOfId && this.selectedOfCode) {
              this.router.navigate(['/of/qualite/points'], {
                queryParams: {
                  ofId: this.selectedOfId,
                  ofCode: this.selectedOfCode
                }
              });
            } else {
              this.router.navigate(['/of/qualite/points'], {
                queryParams: { ofId: this.selectedOfId }
              });
            }
          }
        },
        error: (err) => {
          console.error(err);
          this.toast.error('Erreur lors de l\'enregistrement');
        }
      });
    }
  }
}
