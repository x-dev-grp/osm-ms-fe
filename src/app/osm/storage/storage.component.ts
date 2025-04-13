import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageUnitDtoService } from '../services/storage.service';
import { BaseType } from '../models/base-type';
import {   StorageUnitDto } from '../models/StorageUnitDto';
import { GenericTypeService } from '../services/generic-type.service';
import { TypeCategory } from '../../osm/models/type-category.enum';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../demo/shared/shared.module';
import { ConfigurationComponent } from '../../@theme/layouts/configuration/configuration.component';

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
    MatExpansionPanelHeader,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    ConfigurationComponent,
    MatExpansionPanel,
    MatExpansionPanelTitle
  ],
  styleUrls: ['./storage.component.scss']
})
export class StorageUnitsComponent implements OnInit {
  storageUnits: StorageUnitDto[] = [];
  oilTypes: BaseType[] = [];

  formOpen = false;
  selectedStorageUnit: StorageUnitDto = this.createEmptyUnit();

  displayedColumns: string[] = ['name', 'location', 'maxCapacity', 'currentVolume', 'oilType', 'status', 'actions' , 'fillLevel',
  ];

  constructor(
    private storageUnitService: StorageUnitDtoService,
    private oilTypeService: GenericTypeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStorageUnits();
    this.loadOilTypes();
  }

  createEmptyUnit(): StorageUnitDto {
    return {
      name: '',
      location: '',
      description: '',
      maxCapacity: 0,
      currentVolume: 0,
      status: 'AVAILABLE',
      oilType: undefined,
      nextMaintenanceDate: undefined,
      lastInspectionDate: undefined,
      lastFillDate: undefined,
      lastEmptyDate: undefined
    };
  }

  loadStorageUnits(): void {
    this.storageUnitService.getAllStorageUnit().subscribe((units) => {
      this.storageUnits = units.data;
    });
  }

  loadOilTypes(): void {
    this.oilTypeService.getAllTypes(TypeCategory.OIL_VARIETY).subscribe((types) => {
      this.oilTypes = types.data;
    });
  }
  onSelectOliveVariety(varId: string) {
    this.selectedStorageUnit.oilType = { id: varId } as BaseType;
  }
  onSubmit(): void {
    if (this.selectedStorageUnit.id) {
      this.storageUnitService.updateStorageUnit( this.selectedStorageUnit).subscribe(() => {
        this.snackBar.open('Storage unit updated successfully!', 'Close', { duration: 3000 });
        this.resetForm();
        this.loadStorageUnits();
      });
    } else {
      this.storageUnitService.createStorageUnit(this.selectedStorageUnit).subscribe(() => {
        this.snackBar.open('Storage unit created!', 'Close', { duration: 3000 });
        this.resetForm();
        this.loadStorageUnits();
      });
    }
  }

  edit(unit: StorageUnitDto): void {
    this.selectedStorageUnit = { ...unit };
    this.formOpen = true;
  }

  delete(id: number): void {
    this.storageUnitService.deleteStorageUnit(id).subscribe(() => {
      this.snackBar.open('Storage unit deleted.', 'Close', { duration: 3000 });
      this.loadStorageUnits();
    });
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.selectedStorageUnit = this.createEmptyUnit();
    this.formOpen = false;
  }
  getFillPercentage(unit: StorageUnitDto): number {
    return unit.maxCapacity && unit.maxCapacity > 0
      ? (unit.currentVolume / unit.maxCapacity) * 100
      : 0;
  }
}
