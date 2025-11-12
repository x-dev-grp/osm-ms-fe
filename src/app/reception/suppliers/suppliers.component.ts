// File: suppliers.component.ts
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { GenericTypeService } from '../../shared/services/generic-type.service';
import { Router } from '@angular/router';
import { SupplierType } from '../../shared/models/supplier-type';
import { SupplierTypeService } from '../../shared/services/supplier.service';
import { SUPPLIERS_DASHBOARD_CONFIG } from './suppliers-dashboard.config';
import { DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { MatCardModule } from '@angular/material/card';
import { ToastService } from '../../shared/services/toast.service';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule, // Import the expansion module
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    MatPaginatorModule,
    OsmDashboard,
    MatCardModule
  ],
  standalone: true,
  styleUrls: ['./suppliers.component.scss']
})
export class SupplierComponent implements OnInit, OnDestroy {
  suppliers: SupplierType[] = [];
  message: string = '';
  supplierForm: FormGroup;
  @ViewChild('dashboard') dashboard!: OsmDashboard;
  editingRecordIndex: number = -1;
  formOpen: boolean = false;
  selectedSupplier: SupplierType | null = null;
  dashboardConfig: DashboardConfig = SUPPLIERS_DASHBOARD_CONFIG;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('input') input: any;
  private subs = new Subscription();

  constructor(
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private fb: FormBuilder,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  handleAction(event: { row: SupplierType; action: string }): void {
    const { row, action } = event;
    switch (action) {
      case 'DETAIL':
        this.router.navigate(['/reception/fournisseur/details', row.id], {
          state: { supplier: row } // includes firstName/lastName if present
        });        break;
      case 'READ':
        this.router.navigate(['/reception/fournisseur/info', row.id!]);
        break;
      case 'UPDATE':
        if (row.id) {
          this.router.navigate(['/reception/fournisseur/edit', row.id]);
        }
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
}
