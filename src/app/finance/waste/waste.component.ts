import { Component } from '@angular/core';
import { OosmDashboard } from '../../shared/modules/oosm-dashboard/oosm-dashboard';
import { DashboardConfig } from '../../shared/modules/oosm-dashboard/models/dashboard-config';
import { WASTE_DASHBOARD } from './WASTE_DASHBOARD';
import { Router } from '@angular/router';
import { SupplierTypeService } from '../../shared/services/supplier.service';
import { SupplierType } from '../../shared/models/supplier-type';
import { map, Observable, startWith } from 'rxjs';
import { FormArray, FormGroup } from '@angular/forms';
import { WasteSale } from '../models/Waste.model';
import { WasteSaleService } from '../service/wasteSale.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-waste',
  imports: [OosmDashboard],
  standalone: true,
  templateUrl: './waste.component.html',
  styleUrl: './waste.component.scss'
})
export class WasteComponent {
  suppliers: SupplierType[];
  filteredSuppliers: Observable<SupplierType[]>;
  wasteForm!: FormGroup;

  dashboardConfig: DashboardConfig = WASTE_DASHBOARD;

  constructor(
    private router: Router,
    private toast: ToastService,
    private supplierService: SupplierTypeService,
    private wasteSaleService: WasteSaleService
  ) {}

  get containerSelections(): FormArray {
    return this.wasteForm.get('containerSelections') as FormArray;
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  // load suppliers

  handleAction(event: { action: string; row: WasteSale }): void {
    switch (event.action.toUpperCase()) {
      case 'READ':
        this.router.navigate(['/finance/waste-sales', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/finance/waste-sales', event.row.id, 'edit']);
        break;

      case 'CONFIRM':
        this.confirmWasteSale(event.row);
        break;

      case 'CANCEL':
        this.cancelWasteSale(event.row);
        break;

      case 'DELIVER':
        this.deliverWasteSale(event.row);
        break;
    }
  }

  private loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suppliers = Array.isArray(response.data) ? response.data : [response.data];
          this.setupSupplierAutocomplete();
        }
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  private setupSupplierAutocomplete(): void {
    this.filteredSuppliers = this.wasteForm.get('supplierId')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterSuppliers(this.suppliers, value))
    );
  }

  private _filterSuppliers(suppliers: SupplierType[], value: string | SupplierType): SupplierType[] {
    if (!value || typeof value === 'object') {
      return suppliers;
    }
    const filterValue = value.toLowerCase();
    return suppliers.filter(
      (supplier) => supplier.name.toLowerCase().includes(filterValue) || supplier.lastname.toLowerCase().includes(filterValue)
    );
  }

  confirmWasteSale(waste: WasteSale): void {
    if (waste.id) {
      this.wasteSaleService.confirmWasteSale(waste.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success();
            // Recharger les données du dashboard
            // this.loadDashboardData();
          } else {
            this.toast.error('AUTO.ERREUR_LORS_DE_LA_CONFIRMATION');
          }
        },
        error: (error) => {
          console.error('Error confirming waste sale:', error);
          this.toast.error('AUTO.ERREUR_LORS_DE_LA_CONFIRMATION');
        }
      });
    }
  }

  cancelWasteSale(waste: WasteSale): void {
    if (waste.id) {
      this.wasteSaleService.cancelWasteSale(waste.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success();
            // Recharger les données du dashboard
            // this.loadDashboardData();
          } else {
            this.toast.error('DELIVERIES.MESSAGES.CANCELLED_ERROR');
          }
        },
        error: (error) => {
          console.error('Error cancelling waste sale:', error);
          this.toast.error('DELIVERIES.MESSAGES.CANCELLED_ERROR');
        }
      });
    }
  }

  deliverWasteSale(waste: WasteSale): void {
    if (waste.id) {
      this.wasteSaleService.deliverWasteSale(waste.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toast.success();
            // Recharger les données du dashboard
            // this.loadDashboardData();
          } else {
            this.toast.error('AUTO.ERREUR_LORS_DE_LA_RECEPTION');
          }
        },
        error: (error) => {
          console.error('Error delivering waste sale:', error);
          this.toast.error('AUTO.ERREUR_LORS_DE_LA_RECEPTION');
        }
      });
    }
  }
}
