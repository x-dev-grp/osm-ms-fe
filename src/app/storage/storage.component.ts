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
import { SharedModule } from '../demo/shared/shared.module';
import { ConfigurationComponent } from '../@theme/layouts/configuration/configuration.component';
import { StorageUnitDto } from '../shared/models/StorageUnitDto';
import { BaseType } from '../shared/models/base-type';
import { StorageUnitDtoService } from '../shared/services/storage.service';
import { GenericTypeService } from '../shared/services/generic-type.service';
import { TypeCategory } from '../shared/models/type-category.enum';
import { AttributeType, DashboardConfig, FieldType } from '../shared/modules/osm-dashboard/models/dashboard-config';
import { OsmDashboard } from '../shared/modules/osm-dashboard/osm-dashboard';
import { SearchOperation } from '../shared/models/advanced-search/searchOperation';
import { Router } from '@angular/router';
import { UnifiedDelivery } from '../shared/models/UnifiedDelivery';

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
    OsmDashboard
  ],
  styleUrls: ['./storage.component.scss']
})
export class StorageUnitsComponent implements OnInit {
  storageUnits: StorageUnitDto[] = [];
  oilTypes: BaseType[] = [];
  loading = false;

  dashboardConfig: DashboardConfig = {
    title: 'Gestion des réservoirs',
    baseURL: 'production/storage-units',
    searchEndpoint: 'production/storage-units',
    addNewItem: true,
    addNewItemUrl: '/storage/new',
    fileName: 'storage-units',



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
        label: 'Variété d\'huile',
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
        autoCompleteFilterAttributes: ['name']
      },
      {
        name: 'nextMaintenanceDate',
        label: 'Prochaine maintenance',
        attributeType: AttributeType.date,
        fieldType: FieldType.date,
        sortable: true,
        filterable: true,
        dataTable: false,
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
    private snackBar: MatSnackBar,
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
          this.snackBar.open(response.message || 'Error loading storage units', 'Close', { duration: 3000 });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading storage units:', error);
        this.snackBar.open('Error loading storage units', 'Close', { duration: 3000 });
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
        this.snackBar.open('Error loading oil types', 'Close', { duration: 3000 });
      }
    });
  }
  e: { row: UnifiedDelivery; action: string }
  handleAction(event: { row: StorageUnitDto; action: string } ): void {
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
    }
  }

  private deleteStorageUnit(unit: StorageUnitDto): void {
    if (confirm('Are you sure you want to delete this storage unit?')) {
      this.storageUnitService.deleteStorageUnit(unit.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Storage unit deleted successfully', 'Close', { duration: 3000 });
            this.loadStorageUnits();
          } else {
            this.snackBar.open(response.message || 'Failed to delete storage unit', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting storage unit:', error);
          this.snackBar.open('Error deleting storage unit', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
