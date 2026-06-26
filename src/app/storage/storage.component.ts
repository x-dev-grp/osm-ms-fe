import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../shared/shared.module';
import { StorageUnitDto } from '../shared/models/StorageUnitDto';
import { BaseType } from '../shared/models/base-type';
import { StorageUnitDtoService } from '../shared/services/storage.service';
import { GenericTypeService } from '../shared/services/generic-type.service';
import { TypeCategory } from '../shared/models/type-category.enum';
import { DashboardConfig } from '../shared/modules/oosm-dashboard/models/dashboard-config';
import { OosmDashboard } from '../shared/modules/oosm-dashboard/oosm-dashboard';
import { Router } from '@angular/router';
import { UnifiedDelivery } from '../shared/models/UnifiedDelivery';
import { dashboardConfig } from './storage_dash_config';
import { ToastService } from '../shared/services/toast.service';
import { AssignSupplierComponent } from './assign-supplier/assign-supplier.component';

@Component({
  selector: 'app-storage',
  templateUrl: './storage.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    OosmDashboard
  ],
  styleUrls: ['./storage.component.scss']
})
export class StorageUnitsComponent implements OnInit {
  private readonly i18n = inject(TranslateService);
  @ViewChild('dashboard') dashboard!: OosmDashboard;
  storageUnits: StorageUnitDto[] = [];
  oilTypes: BaseType[] = [];
  loading = false;

  dashboardConfig: DashboardConfig = dashboardConfig;

  constructor(
    private storageUnitService: StorageUnitDtoService,
    private oilTypeService: GenericTypeService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStorageUnits();
    this.loadOilTypes();
  }

  loadStorageUnits(): void {
    this.loading = true;
    this.storageUnitService.getAllStorageUnit().subscribe({
      next: (response) => {
        if (response.success) {
          this.storageUnits = response.data;
        } else {
          this.toastService.error(response.message || 'Error loading storage units');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading storage units:', error);
        this.toastService.error('Error loading storage units');
        this.loading = false;
      }
    });
  }

  loadOilTypes(): void {
    this.oilTypeService.getAllTypes(TypeCategory.OIL_VARIETY).subscribe({
      next: (response) => {
        if (response.success) {
          this.oilTypes = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading oil types:', error);
        this.toastService.error('Error loading oil types');
      }
    });
  }
  e: { row: UnifiedDelivery; action: string };
  handleAction(event: { row: StorageUnitDto; action: string }): void {
    switch (event.action) {
      case 'READ':
        this.router.navigate(['/storage', event.row.id, 'view']);
        break;

      case 'UPDATE':
        this.router.navigate(['/storage', event.row.id, 'edit']);
        break;

      case 'DELETE':
        this.deleteStorageUnit(event.row);
        break;
      case 'ASSIGN_SUPPLIER':
        if (event.row.id) {
          this.openAssignSupplierDialog(event.row);
        }
        break;
    }
  }

  private deleteStorageUnit(unit: StorageUnitDto): void {
    if (confirm(this.i18n.instant('AUTO.ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_STORAGE_UNIT'))) {
      this.storageUnitService.deleteStorageUnit(unit.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Storage unit deleted successfully');
            this.loadStorageUnits();
          } else {
            this.toastService.error(response.message || 'Failed to delete storage unit');
          }
        },
        error: (error) => {
          console.error('Error deleting storage unit:', error);
          this.toastService.error('Error deleting storage unit');
        }
      });
    }
  }

  private openAssignSupplierDialog(unit: StorageUnitDto) {
    const ref = this.dialog.open(AssignSupplierComponent, {
      width: '400px',
      data: { storageUnit: unit }
    });

    ref.afterClosed().subscribe((result) => {
      // assume the dialog returns true if assignment was made
      if (result === true) {
        this.toastService.success('Supplier assigned successfully');
        this.dashboard.refrechData();
      }
    });
  }
}
