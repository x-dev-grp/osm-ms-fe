import { AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SharedModule } from '../../demo/shared/shared.module';
import { ConfigurationComponent } from '../../@theme/layouts/configuration/configuration.component';
import { OilCredit } from '../models/OilCredit';
import { OilCreditService } from '../service/oil-credit.service';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
    ConfigurationComponent
  ],
  templateUrl: './oil-credit.component.html',
  styleUrls: ['./oil-credit.component.scss']
})
export class OilCreditComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup;
  filterForm: FormGroup;
  editing = false;
  isLoading = true;
  submitted = false;
  displayedColumns = ['credit_date', 'citerne_pile', 'emballage', 'quantity', 'unit', 'destinataire', 'actions'];
  dataSource = new MatTableDataSource<OilCredit>([]);
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

    this.filterForm = this.fb.group({
      citerne_pile: [''],
      destinataire: ['']
    });
  }

  ngOnInit(): void {
    // 1) Load storage units and then credits
    this.storageService.getAllStorageUnit().subscribe({
      next: units => {
        // Sort storage units by currentVolume in descending order
        this.storageUnits = units.data.sort((a, b) => b.currentVolume - a.currentVolume);
        this.loadCredits();
      },
      error: () => {
        this.snackBar.open('Échec du chargement des unités de stockage', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });

    // 2) Tell the table how to sort each column
    this.dataSource.sortingDataAccessor = (item: OilCredit, property: string) => {
      switch (property) {
        case 'credit_date':
          return new Date(item.credit_date).getTime();
        case 'citerne_pile':
          return this.getStorageUnitName(item.citerne_pile).toLowerCase();
        default: {
          const value = (item as any)[property];
          return typeof value === 'string' ? value.toLowerCase() : value;
        }
      }
    };

    // 3) Set up filter logic
    this.dataSource.filterPredicate = this.createFilter();

    // 4) Subscribe to filter form changes with debounce
    this.filterSubscription = this.filterForm.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.applyFilter();
    });

    // 5) Subscribe to quantity changes with debounce
    const quantityControl = this.form.get('quantity');
    if (quantityControl) {
      this.quantitySubscription = quantityControl.valueChanges.pipe(
        debounceTime(300)
      ).subscribe((quantity) => {
        this.validateQuantity(quantity);
      });
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    if (this.quantitySubscription) {
      this.quantitySubscription.unsubscribe();
    }
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  private loadCredits(): void {
    this.isLoading = true;
    this.svc.getAllOilCreditList().subscribe({
      next: (res) => {
        if (res.success) {
          this.dataSource.data = res.data;
          this.applyFilter();
        } else {
          this.dataSource.data = [];
          this.snackBar.open('Aucun crédit huile trouvé', 'Fermer', { duration: 3000 });
        }
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Échec du chargement des crédits huile', 'Fermer', { duration: 3000 });
        this.dataSource.data = [];
        this.isLoading = false;
      }
    });
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
      this.snackBar.open(
        `La quantité en KG n'est pas compatible avec le volume en litres de la citerne/pile.`,
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    // Validate volume
    if (quantity > availableVolume) {
      quantityControl?.setErrors({ insufficientVolume: true });
      this.snackBar.open(
        `La quantité demandée (${quantity} L) dépasse le volume disponible (${availableVolume} L).`,
        'Fermer',
        { duration: 3000 }
      );
    }
  }

  getVolumeClass(currentVolume: number, maxCapacity: number): string {
    if (!maxCapacity || maxCapacity <= 0) return 'volume-low';
    const percentage = (currentVolume / maxCapacity) * 100;
    if (percentage >= 75) return 'volume-high';
    if (percentage >= 25) return 'volume-medium';
    return 'volume-low';
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
      this.snackBar.open(
        `La quantité en KG n'est pas compatible avec le volume en litres de la citerne/pile.`,
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    let originalVolume = 0;

    // Handle editing: Add back the original quantity
    if (this.editing) {
      const originalCredit = this.dataSource.data.find(c => c.id === dto.id);
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
    const creditObs = this.editing
      ? this.svc.updateOilCredit(dto)
      : this.svc.createOilCredit(dto);

    // Execute credit save and storage unit update
    creditObs.subscribe({
      next: () => {
        // Update storage unit
        this.storageService.updateStorageUnit(updatedStorageUnit).subscribe({
          next: () => {
            this.snackBar.open(
              this.editing ? 'Crédit huile mis à jour et volume ajusté' : 'Crédit huile créé et volume ajusté',
              'Fermer',
              { duration: 3000 }
            );
            this.cancel();
            this.loadCredits();
          },
          error: () => {
            this.snackBar.open('Échec de la mise à jour du volume de la citerne/pile', 'Fermer', { duration: 3000 });
          }
        });
      },
      error: () => {
        this.snackBar.open('Échec de l\'enregistrement du crédit huile', 'Fermer', { duration: 3000 });
      }
    });
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
        this.loadCredits();
      },
      error: () => {
        this.snackBar.open('Échec de la suppression du crédit huile', 'Fermer', { duration: 3000 });
      }
    });
  }

  getStorageUnitName(id: string): string {
    const unit = this.storageUnits.find(s => s.id === id);
    return unit ? unit.name : '-';
  }

  private createFilter() {
    return (data: OilCredit, filter: string): boolean => {
      const search = JSON.parse(filter);
      const citerneName = this.getStorageUnitName(data.citerne_pile).toLowerCase();
      const destinataire = (data.destinataire || '').toLowerCase();
      return (
        citerneName.includes(search.citerne_pile.toLowerCase()) &&
        destinataire.includes(search.destinataire.toLowerCase())
      );
    };
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify(this.filterForm.value);
    this.paginator?.firstPage();
  }
}
