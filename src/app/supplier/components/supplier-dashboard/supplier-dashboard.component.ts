import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SharedModule } from '../../../demo/shared/shared.module';
import { ConfigurationComponent } from '../../../@theme/layouts/configuration/configuration.component';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { Action, DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { Supplier } from '../../../shared/models/supplier';
import { SupplierService } from '../../../shared/services/supplier.service';
import { SUPPLIER_DASHBOARD } from './SUPPLIER_DASHBOARD';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatSortModule,
    SharedModule,
    ConfigurationComponent,
    OsmDashboard
  ],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.scss']
})
export class SupplierDashboardComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  dashboardConfig: DashboardConfig = SUPPLIER_DASHBOARD;

  private subs = new Subscription();

  constructor(
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchSuppliers();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private fetchSuppliers(): void {
    this.subs.add(
      this.supplierService.getAllSuppliers().subscribe((res) => {
        this.suppliers = res.success ? res.data : [];
        if (!res.success) this.toast(res.message || 'Erreur lors du chargement des fournisseurs.');
      })
    );
  }

  viewSupplier(s: Supplier): void {
    this.router.navigate(['supplier', s.id]);
  }

  onRowAction(e: { row: Supplier; action: Action }): void {
    switch (e.action.value) {
      case 'CONSULTER':
        this.viewSupplier(e.row);
        break;
      case 'MODIFIER':
        this.router.navigate(['supplier', e.row.id, 'edit']);
        break;
      case 'SUPPRIMER':
        if (e.row.id) this.deleteSupplier(e.row);
        break;
    }
  }

  private deleteSupplier(s: Supplier): void {
    this.subs.add(
      this.supplierService.deleteSupplier(s.id!).subscribe(
        (res) => {
          if (res.success) {
            this.fetchSuppliers();
            this.toast('Fournisseur supprimé avec succès.');
          }
        },
        () => this.toast('Erreur lors de la suppression.')
      )
    );
  }

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['']
    });
  }
} 