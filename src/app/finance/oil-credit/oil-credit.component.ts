import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SharedModule } from '../../demo/shared/shared.module';
import { OilCredit, CreditState, UnitType } from '../models/OilCredit';
import { OilCreditService } from '../service/oil-credit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OIL_CREDIT_DASHBOARD } from './oil-credit-dashboard.config';

@Component({
  selector: 'app-oil-credit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatExpansionModule,
    MatSnackBarModule,
    SharedModule,
    OsmDashboard
  ],
  templateUrl: './oil-credit.component.html',
  styleUrls: ['./oil-credit.component.scss']
})
export class OilCreditComponent implements OnInit {
  form: FormGroup;
  editing = false;
  isLoading = true;
  submitted = false;

  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private svc = inject(OilCreditService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private data: OilCredit[] = [];
  private route = inject(ActivatedRoute);

  constructor() {
    this.form = this.fb.group({
      id: [null],
      emballage: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      unit: [UnitType.L, Validators.required],
      oil_type: ['', Validators.required],
      destinataire: ['', Validators.required],
      transaction_id_in: [null],
      transaction_id_out: [null],
      creditState: [CreditState.PENDING, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCredits();
  }

  save(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les erreurs dans le formulaire.', 'Fermer', { duration: 3000 });
      return;
    }

    const dto: OilCredit = this.form.value;

    // Set default credit state if not provided
    if (!dto.creditState) {
      dto.creditState = CreditState.PENDING;
    }

    const creditObs = this.editing ? this.svc.updateOilCredit(dto) : this.svc.createOilCredit(dto);

    creditObs.subscribe({
      next: () => {
        this.snackBar.open(
          this.editing ? 'Crédit huile mis à jour avec succès' : 'Crédit huile créé avec succès',
          'Fermer',
          { duration: 3000 }
        );
        this.cancel();
        this.loadCredits();
      },
      error: (error) => {
        console.error('Error saving oil credit:', error);
        this.snackBar.open(
          this.editing ? 'Erreur lors de la mise à jour du crédit huile' : 'Erreur lors de la création du crédit huile',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  cancel(): void {
    this.editing = false;
    this.submitted = false;
    this.form.reset({
      unit: UnitType.L,
      creditState: CreditState.PENDING
    });
  }

  openForm(o?: OilCredit): void {
    this.editing = !!o;
    if (o) {
      this.form.patchValue(o);
    } else {
      this.form.reset({
        unit: UnitType.L,
        creditState: CreditState.PENDING
      });
    }
  }

  view(id: string): void {
    this.router.navigate(['/finance/oil-credit', id, 'view']);
  }

  delete(id: string): void {
    this.confirmDelete(id);
  }

  handleAction(event: { action: Action; row: OilCredit }): void {
    const { action, row } = event;
    const id = row.id;

    switch (action.value) {
      case 'view':
        this.view(id!);
        break;
      case 'edit':
        this.openForm(row);
        break;
      case 'delete':
        this.confirmDelete(id);
        break;
    }
  }

  private confirmDelete(id?: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce crédit huile ?')) {
      this.svc.deleteOilCredit(id!).subscribe({
        next: () => {
          this.snackBar.open('Crédit huile supprimé avec succès', 'Fermer', { duration: 3000 });
          this.loadCredits();
        },
        error: (error) => {
          console.error('Error deleting oil credit:', error);
          this.snackBar.open('Erreur lors de la suppression du crédit huile', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  private loadCredits(): void {
    this.isLoading = true;
    this.svc.getAllOilCreditList().subscribe({
      next: (response) => {
        this.data = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading oil credits:', error);
        this.snackBar.open('Erreur lors du chargement des crédits huile', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  // Helper methods for display
  getCreditStateLabel(state: CreditState): string {
    const labels = {
      [CreditState.PENDING]: 'En attente',
      [CreditState.APPROVED]: 'Approuvé',
      [CreditState.REJECTED]: 'Rejeté',
      [CreditState.COMPLETED]: 'Terminé',
      [CreditState.CANCELLED]: 'Annulé'
    };
    return labels[state] || state;
  }

  getUnitLabel(unit: UnitType): string {
    return unit === UnitType.L ? 'Litre' : 'Kilogramme';
  }
}

