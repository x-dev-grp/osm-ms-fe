import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../demo/shared/shared.module';
import { StorageUnitDtoService } from '../../../shared/services/storage.service';
import { StorageUnitDto } from '../../../shared/models/StorageUnitDto';
import { ApiResponse } from '../../../shared/models/api-response';
import { OilCredit } from '../../models/OilCredit';
import { OilCreditService } from '../../service/oil-credit.service';

@Component({
  selector: 'app-oil-credit-add',
  templateUrl: './oil-credit-add.component.html',
  styleUrls: ['./oil-credit-add.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule, SharedModule]
})
export class OilCreditAddComponent implements OnInit {
  form: FormGroup;
  editing = false;
  submitted = false;
  loading = false;
  storageUnits: StorageUnitDto[] = [];
  selectedStorageUnit: StorageUnitDto | null = null;
  private data: OilCredit[] = [];

  constructor(private fb: FormBuilder, private oilCreditService: OilCreditService, private storageUnitService: StorageUnitDtoService, private snackBar: MatSnackBar, private route: ActivatedRoute, private router: Router) {
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
    this.loadStorageUnits();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadOilCredit(id);
    }
  }

  onStorageUnitSelected(unitId: string): void {
    const unit = this.storageUnits.find(u => u.id === unitId);
    if (unit) {
      this.selectedStorageUnit = unit;
      this.validateQuantity(this.form.get('quantity')?.value);
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

    const dto = this.form.value;
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
      ...this.selectedStorageUnit, currentVolume: newVolume
    };

    // Save oil credit
    const creditObs = this.editing ? this.oilCreditService.updateOilCredit(dto) : this.oilCreditService.createOilCredit(dto);

    // Execute credit save and storage unit update
    creditObs.subscribe({
      next: () => {
        // Update storage unit
        this.storageUnitService.updateStorageUnit(updatedStorageUnit).subscribe({
          next: () => {
            this.snackBar.open(this.editing ? 'Crédit huile mis à jour et volume ajusté' : 'Crédit huile créé et volume ajusté', 'Fermer', { duration: 3000 });
            this.router.navigate(['/finance/oil-credit']);
          }, error: () => {
            this.snackBar.open('Échec de la mise à jour du volume de la citerne/pile', 'Fermer', { duration: 3000 });
          }
        });
      }, error: () => {
        this.snackBar.open('Échec de l\'enregistrement du crédit huile', 'Fermer', { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/finance/oil-credit']);
  }

  private loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit().subscribe({
      next: (response: ApiResponse<StorageUnitDto>) => {
        this.storageUnits = response.data.sort((a, b) => b.currentVolume - a.currentVolume);
      }, error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement des unités de stockage', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  private loadOilCredit(id: string): void {
    this.loading = true;
    this.oilCreditService.getOilCredit(id).subscribe({
      next: (response: ApiResponse<OilCredit>) => {
        if (response.data && response.data.length > 0) {
          const credit = response.data[0];
          this.form.patchValue(credit);
          this.editing = true;
          if (credit.citerne_pile) {
            this.onStorageUnitSelected(credit.citerne_pile);
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.snackBar.open('Erreur lors du chargement du crédit d\'huile', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }
}
