import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LigneConditionnementService } from '../../../services/ligne-conditionnement.service';
import { LigneConditionnement, Statue } from '../../../models/ligne-conditionnement.model';
import {HttpHandler, HttpRequest} from "@angular/common/http";

@Component({
  selector: 'app-ligne-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ligne-form.component.html',
  styleUrls: ['./ligne-form.component.scss']
})
export class LigneFormComponent implements OnInit {
  ligneForm: FormGroup;
  isEditMode = false;
  ligneId?: string;
  submitted = false;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private ligneService: LigneConditionnementService
  ) {
    this.ligneForm = this.fb.group({
      code: [''],
      nom: ['', Validators.required],
      description: [''],
      etat: [Statue.ACTIF, Validators.required],
      vitesseNominale: [null],
      tempsPreparation: [null],
      tempsNettoyage: [null],
      responsable: [''],
      notes: [''],
      dateDerniereMaintenance: [null],
      dateProchaineMaintenance: [null],
    });
    this.ligneForm.setValidators(this.dateRangeValidator());
  }
  private dateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dateDerniere = control.get('dateDerniereMaintenance')?.value;
      const dateProchaine = control.get('dateProchaineMaintenance')?.value;
      if (dateDerniere && dateProchaine && new Date(dateProchaine) < new Date(dateDerniere)) {
        return { dateInvalid: true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    this.ligneId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.ligneId;

    if (this.isEditMode) {
      this.loadLigne();
    }
  }

  get f() {
    return this.ligneForm.controls;
  }

  loadLigne(): void {
    this.loading = true;
    this.ligneService.getLigneById(this.ligneId!).subscribe({
      next: (ligne) => {
        this.ligneForm.patchValue({
          code: ligne.code,
          nom: ligne.nom,
          description: ligne.description || '',
          etat: ligne.etat,
          vitesseNominale: ligne.vitesseNominale || null,
          tempsPreparation: ligne.tempsPreparation || null,
          tempsNettoyage: ligne.tempsNettoyage || null,
          responsable: ligne.responsable || '',
          notes: ligne.notes || '',
          dateDerniereMaintenance: ligne.dateDerniereMaintenance || null,
          dateProchaineMaintenance: ligne.dateProchaineMaintenance || null
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement', err);
        this.error = 'Impossible de charger la ligne';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.ligneForm.invalid) {
      return;
    }

    const formValue = this.ligneForm.value;

    const ligne: LigneConditionnement = {
      ...formValue,
      code: formValue.code && formValue.code.trim() !== ''
        ? formValue.code
        : this.generateCode(formValue.nom),
      actif: true
    };

    if (this.isEditMode) {
      this.ligneService.updateLigne(this.ligneId!, ligne).subscribe({
        next: () => this.router.navigate(['/stock/lignes', this.ligneId]),
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.error = 'Erreur lors de la mise à jour';
        }
      });
    } else {
      this.ligneService.createLigne(ligne).subscribe({
        next: (created) => this.router.navigate(['/stock/lignes', created.id]),
        error: (err) => {
          console.error('Erreur création', err);
          this.error = 'Erreur lors de la création';
        }
      });
    }
  }


  private generateCode(nom: string): string {
    const base = nom?.substring(0, 3)?.toUpperCase() || 'LIG';
    const random = Math.floor(Math.random() * 1000);
    return `${base}-${Date.now()}-${random}`;
  }


  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('access_token');

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/stock/lignes', this.ligneId]);
    } else {
      this.router.navigate(['/stock/lignes']);
    }
  }
}
