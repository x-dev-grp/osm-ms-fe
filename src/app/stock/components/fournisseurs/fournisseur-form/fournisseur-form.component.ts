import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FournisseurService } from '../../../services/fournisseur.service';
import { Fournisseur, CategorieFournisseur } from '../../../models/fournisseur.model';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'app-fournisseur-form',
  standalone: true,
  imports: [TranslateModule, CommonModule, ReactiveFormsModule],
  templateUrl: './fournisseur-form.component.html',
  styleUrls: ['./fournisseur-form.component.scss']
})
export class FournisseurFormComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  fournisseurForm: FormGroup;
  categories = Object.values(CategorieFournisseur);


  isEditMode = false;
  fournisseurId?: string;
  submitted = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private fournisseurService: FournisseurService
  ) {
    this.fournisseurForm = this.fb.group({
      code: [''],
      nom: ['', Validators.required],
      nomCommercial: [''],
      email: ['', Validators.email],
      telephone: [''],
      fax: [''],
      siteWeb: [''],
      numeroTva: [''],
      adresse: [''],
      ville: [''],
      codePostal: [''],
      pays: [''],
      contactNom: [''],
      contactPrenom: [''],
      contactEmail: ['', Validators.email],
      contactTelephone: [''],
      categorieFournisseur: [''],
      delaiLivraisonMoyen: [0, [Validators.min(0)]],
      conditionsPaiement: [''],
      currency: ['TND', Validators.required], // ⚡ correspond au backend
      actif: [true]
    });
  }

  ngOnInit(): void {
    this.fournisseurId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.fournisseurId;

    if (this.isEditMode) {
      this.loadFournisseur();
    }
  }

  loadFournisseur(): void {
    this.fournisseurService.getFournisseurById(this.fournisseurId!).subscribe({
      next: (fournisseur) => {
        this.fournisseurForm.patchValue({
          code: fournisseur.code,
          nom: fournisseur.nom,
          nomCommercial: fournisseur.nomCommercial,
          email: fournisseur.email,
          telephone: fournisseur.telephone,
          fax: fournisseur.fax,
          siteWeb: fournisseur.siteWeb,
          numeroTva: fournisseur.numeroTva,
          adresse: fournisseur.adresse,
          ville: fournisseur.ville,
          codePostal: fournisseur.codePostal,
          pays: fournisseur.pays,
          contactNom: fournisseur.contactNom,
          contactPrenom: fournisseur.contactPrenom,
          contactEmail: fournisseur.contactEmail,
          contactTelephone: fournisseur.contactTelephone,
          categorieFournisseur: fournisseur.categorieFournisseur,
          delaiLivraisonMoyen: fournisseur.delaiLivraisonMoyen,
          conditionsPaiement: fournisseur.conditionsPaiement,
          currency: fournisseur.currency,
          actif: fournisseur.actif
        });
      },
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.fournisseurForm.invalid) {
      const firstInvalid = document.querySelector('.is-invalid');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.submitting = true;
    const fournisseur: Fournisseur = this.fournisseurForm.value;
    if (this.isEditMode) {
      fournisseur.code = this.fournisseurForm.get('code')?.value;

      this.fournisseurService.updateFournisseur(this.fournisseurId!, fournisseur).subscribe({
        next: () => {
          this.router.navigate(['/stock/fournisseurs', this.fournisseurId]);
        },
        error: (error) => {
          console.error('Erreur mise à jour:', error);
          this.submitting = false;
          alert(this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_MISE_A_JOUR_DU_FOURNISSEUR'));
        }
      });
    } else {
      this.fournisseurService.createFournisseur(fournisseur).subscribe({
        next: (created) => {
          this.router.navigate(['/stock/fournisseurs', created.id]);
        },
        error: (error) => {
          console.error('Erreur création:', error);
          this.submitting = false;
          alert(this.i18n.instant('AUTO.ERREUR_LORS_DE_LA_CREATION_DU_FOURNISSEUR'));
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/stock/fournisseurs', this.fournisseurId]);
    } else {
      this.router.navigate(['/stock/fournisseurs']);
    }
  }

  get f() {
    return this.fournisseurForm.controls;
  }


}
