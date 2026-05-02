import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-ligne-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './ligne-form.component.html',
  styleUrls: ['./ligne-form.component.scss']
})
export class LigneFormComponent implements OnInit {
  ligneForm!: FormGroup;
  isEditMode = false;
  ligneId: string | null = null;
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private ligneService: LigneConditionnementService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.ligneId = this.route.snapshot.paramMap.get('id');
    if (this.ligneId) {
      this.isEditMode = true;
      this.loadLigne(this.ligneId);
    }
  }

  private initForm(): void {
    this.ligneForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      etat: [Statue.ACTIF, Validators.required],
      vitesseNominale: [0, [Validators.min(0)]],
      tempsPreparation: [0, [Validators.min(0)]],
      tempsNettoyage: [0, [Validators.min(0)]],
      responsable: [''],
      dateDerniereMaintenance: [null],
      dateProchaineMaintenance: [null],
      notes: ['']
    }, { validators: this.dateValidator });
  }

  private loadLigne(id: string): void {
    this.loading.set(true);
    this.ligneService.getLigneById(id).subscribe({
      next: (ligne) => {
        this.ligneForm.patchValue({
          ...ligne,
          dateDerniereMaintenance: ligne.dateDerniereMaintenance ? new Date(ligne.dateDerniereMaintenance.toString()) : null,
          dateProchaineMaintenance: ligne.dateProchaineMaintenance ? new Date(ligne.dateProchaineMaintenance.toString()) : null
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement ligne', err);
        this.toast.error('Erreur lors du chargement des données');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.ligneForm.invalid) {
      this.ligneForm.markAllAsTouched();
      this.toast.warning('Veuillez vérifier les champs du formulaire');
      return;
    }

    this.submitting.set(true);
    const formValue = this.ligneForm.value;
    
    // Format dates back to string if needed by backend (assuming ISO string)
    const payload = {
      ...formValue,
      dateDerniereMaintenance: formValue.dateDerniereMaintenance ? formValue.dateDerniereMaintenance.toISOString().split('T')[0] : null,
      dateProchaineMaintenance: formValue.dateProchaineMaintenance ? formValue.dateProchaineMaintenance.toISOString().split('T')[0] : null
    };

    if (this.isEditMode && this.ligneId) {
      this.ligneService.updateLigne(this.ligneId, payload).subscribe({
        next: () => {
          this.toast.success('Ligne mise à jour avec succès');
          this.router.navigate(['/stock/lignes', this.ligneId]);
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Erreur update', err);
          this.toast.error('Erreur lors de la mise à jour');
          this.submitting.set(false);
        }
      });
    } else {
      this.ligneService.createLigne(payload).subscribe({
        next: (created) => {
          this.toast.success('Ligne créée avec succès');
          this.router.navigate(['/stock/lignes', created.id]);
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Erreur create', err);
          this.toast.error('Erreur lors de la création');
          this.submitting.set(false);
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode && this.ligneId) {
      this.router.navigate(['/stock/lignes', this.ligneId]);
    } else {
      this.router.navigate(['/stock/lignes']);
    }
  }

  private dateValidator(group: FormGroup): any {
    const start = group.get('dateDerniereMaintenance')?.value;
    const end = group.get('dateProchaineMaintenance')?.value;

    if (start && end && new Date(start) > new Date(end)) {
      return { dateInvalid: true };
    }
    return null;
  }
}
