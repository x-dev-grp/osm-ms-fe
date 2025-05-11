import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
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
import { StorageUnitDto } from '../../shared/models/StorageUnitDto';
import { BaseType } from '../../shared/models/base-type';
import { StorageUnitDtoService } from '../../shared/services/storage.service';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { AttributeType, DashboardConfig, FieldType } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { SearchOperation } from '../../shared/models/advanced-search/searchOperation';

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
    MatExpansionPanelTitle,
    OsmDashboard
  ],
  styleUrls: ['./storage.component.scss']
})
export class StorageUnitsComponent implements OnInit {
  storageUnits: StorageUnitDto[] = [];
  oilTypes: BaseType[] = [];

  formOpen = false;
  selectedStorageUnit: StorageUnitDto = this.createEmptyUnit();

  displayedColumns: string[] = ['name', 'location', 'maxCapacity', 'currentVolume', 'oilType', 'status', 'actions', 'fillLevel'];
  storagConfig: DashboardConfig = {
    title: 'Gestion des réservoirs',
    baseURL: 'storage-units', // CRUD root
    searchEndpoint: 'production/storage-units', // POST /search
    addNewItem: false,
    addNewItemUrl: '/storage-units', // change if you add a “+” button
    fileName: 'storage-units', // CSV/PDF file name

    /* -------- Row-level actions (static list) ------------------------- */
    actions: {
      statusMapping: false,
      statusAttributeName: 'status',
      actionsList: [  { label: 'Consulter',          icon: 'visibility',  value: 'CONSULTER'  },
        { label: 'Modifier',           icon: 'edit',        value: 'MODIFIER'   },
        { label: 'Supprimer',          icon: 'delete',      value: 'SUPPRIMER'  },],
      actionsStatusList: {} // keep empty until you need status→actions mapping
    },

    /* -------- Table columns / filters / export ----------------------- */
    fields: [
      {
        name: 'name',
        label: 'Nom',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: true,
        dataTable: true,
        exportable: true,
        exportLabel: 'Nom',
        filterAttribute: 'name'
      },
      {
        name: 'location',
        label: 'Emplacement',
        attributeType: AttributeType.string,
        fieldType: FieldType.text,
        sortable: true,
        filterable: true,
        defaultFilter: true,
        dataTable: true,
        exportable: true
      },
      {
        name: 'maxCapacity',
        label: 'Capacité (l)',
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        sortable: true,
        filterable: false,
        dataTable: true,
        exportable: true
      },
      {
        name: 'currentVolume',
        label: 'Volume (l)',
        attributeType: AttributeType.number,
        fieldType: FieldType.number,
        sortable: true,
        filterable: false,
        dataTable: true,
        exportable: true
      },
      {
        name: 'status',
        label: 'Statut',
        attributeType: AttributeType.string,
        fieldType: FieldType.select,
        sortable: true,
        filterable: true,
        defaultFilter: true,
        dataTable: true,
        options: [
          { label: 'Disponible', value: 'AVAILABLE' },
          { label: 'Pleine', value: 'FULL' },
          { label: 'Remplissage', value: 'FILLING' },
          { label: 'Maintenance', value: 'MAINTENANCE' },
          { label: 'En service', value: 'IN_USE' },
          { label: 'Nettoyage', value: 'CLEANING' },
          { label: 'Réservée', value: 'RESERVED' },
          { label: 'Hors service', value: 'OUT_OF_SERVICE' }
        ],
        exportable: true
      },
      {
        name: 'oilVariety.name',
        label: 'Variety d’huile',
        valuePath: 'oilVariety.name',
        attributeType: AttributeType.string,
        fieldType: FieldType.autocomplete,
        sortable: true,
        filterable: true,
        dataTable: true,
        exportable: true,
        getOptionsUrl: 'production/types',
        autoCompleteDefaultCriteria: {
          page: 0,
          size: 10,
          sort: 'createdDate',
          order: 'DESC',
          searchData: {
            operation: SearchOperation.AND,
            searchs: [],
            search: {
              type: {
                equalValue: TypeCategory.OIL_VARIETY
              }
            }
          }
        },
        autoCompleteFilterAttributes: ['name'],
       },

      {
        name: 'nextMaintenanceDate',
        label: 'Prochaine maintenance',
        attributeType: AttributeType.date,
        fieldType: FieldType.date,
        sortable: true,
        filterable: true,
        dataTable: false, // hide from table, still filter/export
        exportable: true
      },
      {
        name: 'lastInspectionDate',
        label: 'Dernière inspection',
        attributeType: AttributeType.date,
        fieldType: FieldType.date,
        sortable: true,
        filterable: true,
        dataTable: false,
        exportable: true
      }
    ]

  };

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
      this.storageUnitService.updateStorageUnit(this.selectedStorageUnit).subscribe(() => {
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

  delete(id: string): void {
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
    return unit.maxCapacity && unit.maxCapacity > 0 ? (unit.currentVolume / unit.maxCapacity) * 100 : 0;
  }
  onRowAction(event: { row: StorageUnitDto; action: string }): void {
    switch (event.action) {
   case 'Consulter':
        // Re-use the edit form in read-only mode if you like.
        // For now we open the record just as for “modier”.
        this.edit(event.row);
        break;

      case 'MODIFIER':
        this.edit(event.row);
        break;

      case 'Supprimer':
        if (event.row.id) {
          this.delete(event.row.id );
        }
        break;
    }
  }
}
