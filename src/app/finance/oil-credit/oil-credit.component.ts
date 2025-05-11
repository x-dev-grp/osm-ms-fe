import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { ConfigurationComponent } from '../../@theme/layouts/configuration/configuration.component';
import { OilCredit, UnitType } from '../models/OilCredit';
import { OilCreditService } from '../service/oil-credit.service';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';

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
    ConfigurationComponent,
    OsmDashboard
  ],
  templateUrl: './oil-credit.component.html',
  styleUrls: ['./oil-credit.component.scss']
})
export class OilCreditComponent implements OnInit {
  form: FormGroup;
  filterForm: FormGroup;
  editing = false;
  isLoading = true;
  submitted = false;
  displayedColumns = ['credit_date', 'citerne_pile', 'emballage', 'quantity', 'unit', 'destinataire', 'actions'];

  OIL_CREDIT_DASHBOARD: DashboardConfig = {
    title: "Crédits d'huile",
    titleTranslatePath: 'FINANCE.OIL_CREDITS.TITLE',
    baseURL: 'finance/oil-credit',
    searchEndpoint: 'finance/oil-credit',
    addNewItem: true,
    addNewItemUrl: 'finance/oil-credits/new',

    fields: [
      // Identifiant interne
      {
        name: 'id',
        label: 'ID',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        exportable: false,
        sortable: false,
        dataTable: false
      },
      // Date du crédit
      {
        name: 'credit_date',
        label: 'Date',
        attributeType: AttributeType.date,
        fieldType: FieldType.date,
        exportable: true,
        sortable: true,
        dataTable: true
      },
      // Citerne / Pile
      {
        name: 'citerne_pile',
        label: 'Citerne/Pile',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        exportable: true,
        sortable: true,
        dataTable: true
      },
      // Type d\'emballage
      {
        name: 'emballage',
        label: 'Emballage',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        exportable: true,
        sortable: true,
        dataTable: true
      },
      // Quantité créditée
      {
        name: 'quantity',
        label: 'Quantité',
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        exportable: true,
        sortable: true,
        dataTable: true
      },
      // Unité (KG, L)
      {
        name: 'unit',
        label: 'Unité',
        attributeType: AttributeType.enum,
        fieldType: FieldType.select,
        exportable: true,
        sortable: true,
        dataTable: true,
        options: [
          { label: UnitType.KG, value: UnitType.KG },
          { label: UnitType.L, value: UnitType.L }
        ]
      },
      // Destinataire
      {
        name: 'destinataire',
        label: 'Destinataire',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        exportable: true,
        sortable: true,
        dataTable: true
      }
    ],

    actions: {
      statusMapping: false,
      statusAttributeName: 'name',
      actionsList: [  { label: 'Consulter',          icon: '',  value: 'CONSULTER'  },
        { label: 'Modifier',           icon: 'edit',        value: 'MODIFIER'   },
        { label: 'Supprimer',          icon: 'delete',      value: 'SUPPRIMER'  },]
    },

    fileName: 'oil_credits'
  };
  storageUnits: StorageUnitDto[] = [];
  selectedStorageUnit: StorageUnitDto | null = null;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private storageService = inject(StorageUnitDtoService);
  private svc = inject(OilCreditService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private quantitySubscription: Subscription | null = null;
  private filterSubscription: Subscription | null = null;
  private data: OilCredit[];

  constructor() {
    this.form = this.fb.group({
      id: [null],
      credit_date: [null, Validators.required],
      citerne_pile: [null, Validators.required],
      emballage: [''],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      unit: ['L', Validators.required],
      destinataire: ['']
    });
  }

  ngOnInit(): void {
    // 1) Load storage units and then credits
    this.storageService.getAllStorageUnit().subscribe({
      next: (units) => {
        // Sort storage units by currentVolume in descending order
        this.storageUnits = units.data.sort((a, b) => b.currentVolume - a.currentVolume);
        this.loadCredits();
      },
      error: () => {
        this.snackBar.open('Échec du chargement des unités de stockage', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });

    // 5) Subscribe to quantity changes with debounce
    const quantityControl = this.form.get('quantity');
    if (quantityControl) {
      this.quantitySubscription = quantityControl.valueChanges.pipe(debounceTime(300)).subscribe((quantity) => {
        this.validateQuantity(quantity);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.quantitySubscription) {
      this.quantitySubscription.unsubscribe();
    }
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  validateQuantity(quantity: number): void {
    if (!this.selectedStorageUnit || !quantity) {
      return;
    }

    const unit = this.form.get('unit')?.value;
    const availableVolume = this.selectedStorageUnit.currentVolume;

    // Clear previous errors
    const quantityControl = this.form.get('quantity');
    if (quantityControl?.hasError('insufficientVolume') || quantityControl?.hasError('unitMismatch')) {
      quantityControl.setErrors(null);
    }

    // Validate unit
    if (unit === 'KG') {
      quantityControl?.setErrors({ unitMismatch: true });
      this.snackBar.open(`La quantité en KG n'est pas compatible avec le volume en litres de la citerne/pile.`, 'Fermer', {
        duration: 3000
      });
      return;
    }

    // Validate volume
    if (quantity > availableVolume) {
      quantityControl?.setErrors({ insufficientVolume: true });
      this.snackBar.open(`La quantité demandée (${quantity} L) dépasse le volume disponible (${availableVolume} L).`, 'Fermer', {
        duration: 3000
      });
    }
  }

  onStorageUnitSelected(selectedId: string): void {
    if (!selectedId) {
      this.selectedStorageUnit = null;
      this.form.get('citerne_pile')?.setValue(null);
      return;
    }

    // Get detailed storage unit info
    this.storageService.getStorageUnit(selectedId).subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          const storageUnit = response.data[0];
          this.selectedStorageUnit = storageUnit;

          // Check if storage unit has oil
          const hasOil = storageUnit.currentVolume > 0;
          const isAvailable = storageUnit.status === 'AVAILABLE' || storageUnit.status === 'FULL';

          if (!hasOil) {
            this.snackBar.open("Cette citerne/pile ne contient pas d'huile.", 'Fermer', { duration: 3000 });
            this.form.get('citerne_pile')?.setValue(null);
            this.selectedStorageUnit = null;
            return;
          }

          if (!isAvailable) {
            this.snackBar.open(`Cette citerne/pile n'est pas disponible (Status: ${storageUnit.status})`, 'Fermer', { duration: 3000 });
            this.form.get('citerne_pile')?.setValue(null);
            this.selectedStorageUnit = null;
            return;
          }

          // Validate current quantity (if already entered)
          const currentQuantity = this.form.get('quantity')?.value;
          if (currentQuantity) {
            this.validateQuantity(currentQuantity);
          }
        } else {
          this.snackBar.open('Impossible de récupérer les informations de la citerne/pile', 'Fermer', { duration: 3000 });
          this.form.get('citerne_pile')?.setValue(null);
          this.selectedStorageUnit = null;
        }
      },
      error: () => {
        this.snackBar.open('Erreur lors de la récupération des informations de la citerne/pile', 'Fermer', { duration: 3000 });
        this.form.get('citerne_pile')?.setValue(null);
        this.selectedStorageUnit = null;
      }
    });
  }

  save(): void {
    this.submitted = true;

    if (this.form.invalid || !this.selectedStorageUnit) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les erreurs dans le formulaire.', 'Fermer', { duration: 3000 });
      return;
    }

    const dto: OilCredit = this.form.value;
    const quantity = dto.quantity;
    const unit = dto.unit;

    // Validate unit compatibility
    if (unit === 'KG') {
      this.form.get('quantity')?.setErrors({ unitMismatch: true });
      this.snackBar.open(`La quantité en KG n'est pas compatible avec le volume en litres de la citerne/pile.`, 'Fermer', {
        duration: 3000
      });
      return;
    }

    let originalVolume = 0;

    // Handle editing: Add back the original quantity
    if (this.editing) {
      const originalCredit = this.data.find((c) => c.id === dto.id);
      if (originalCredit && originalCredit.unit === 'L') {
        originalVolume = originalCredit.quantity;
      }
    }

    // Calculate new volume: add back original (if editing), subtract new
    const newVolume = this.selectedStorageUnit.currentVolume + originalVolume - quantity;

    if (newVolume < 0) {
      this.form.get('quantity')?.setErrors({ insufficientVolume: true });
      this.snackBar.open('La quantité demandée dépasse le volume disponible dans la citerne/pile.', 'Fermer', { duration: 3000 });
      return;
    }

    // Prepare storage unit update
    const updatedStorageUnit: StorageUnitDto = {
      ...this.selectedStorageUnit,
      currentVolume: newVolume
    };

    // Save oil credit
    const creditObs = this.editing ? this.svc.updateOilCredit(dto) : this.svc.createOilCredit(dto);

    // Execute credit save and storage unit update
    creditObs.subscribe({
      next: () => {
        // Update storage unit
        this.storageService.updateStorageUnit(updatedStorageUnit).subscribe({
          next: () => {
            this.snackBar.open(this.editing ? 'Crédit huile mis à jour et volume ajusté' : 'Crédit huile créé et volume ajusté', 'Fermer', {
              duration: 3000
            });
            this.cancel();
          },
          error: () => {
            this.snackBar.open('Échec de la mise à jour du volume de la citerne/pile', 'Fermer', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.snackBar.open("Échec de l'enregistrement du crédit huile", 'Fermer', { duration: 3000 });
      }
    });
  }

  getVolumeClass(currentVolume: number, maxCapacity: number): string {
    if (!maxCapacity || maxCapacity <= 0) return 'volume-low';
    const percentage = (currentVolume / maxCapacity) * 100;
    if (percentage >= 75) return 'volume-high';
    if (percentage >= 25) return 'volume-medium';
    return 'volume-low';
  }

  getStorageUnitName(id: string): string {
    const unit = this.storageUnits.find((s) => s.id === id);
    return unit ? unit.name : '-';
  }

  cancel(): void {
    this.editing = false;
    this.submitted = false;
    this.form.reset({ id: null, credit_date: null, citerne_pile: null, emballage: '', quantity: null, unit: 'L', destinataire: '' });
    this.selectedStorageUnit = null;
  }

  openForm(o?: OilCredit): void {
    if (o) {
      this.editing = true;
      this.submitted = false;
      this.form.patchValue(o);
      // Re-fetch storage unit details for editing
      if (o.citerne_pile) {
        this.onStorageUnitSelected(o.citerne_pile);
      }
    } else {
      this.cancel();
    }
  }

  view(id: string): void {
    this.router.navigate(['/finance/oil-credit', id, 'view']);
  }

  delete(id: string): void {
    if (!confirm('Supprimer ce crédit huile ?')) return;
    this.svc.deleteOilCredit(id).subscribe({
      next: () => {
        this.snackBar.open('Crédit huile supprimé', 'Fermer', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Échec de la suppression du crédit huile', 'Fermer', { duration: 3000 });
      }
    });
  }

  /** Handle row‐level actions emitted by the dashboard */
  onRowAction(event: { action: string; record: OilCredit }): void {
     switch (event.action) {
      case 'consulter':
        this.router.navigate(['/finance/oil-credit', event.record.id, 'view']);
        break;
      case 'modifier':
        this.openForm(event.record);
        break;
      case 'supprimer':
        this.svc.deleteOilCredit(event.record.id!);
        break;
    }
  }

  private loadCredits(): void {
    this.isLoading = true;
    this.svc.getAllOilCreditList().subscribe({
      next: (res) => {
        if (res.success) {
          this.data = res.data;
        } else {
          this.data = [];
          this.snackBar.open('Aucun crédit huile trouvé', 'Fermer', { duration: 3000 });
        }
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Échec du chargement des crédits huile', 'Fermer', { duration: 3000 });
        this.data = [];
        this.isLoading = false;
      }
    });
  }


}
