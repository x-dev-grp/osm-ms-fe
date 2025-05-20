import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {MatSortModule} from '@angular/material/sort';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {SharedModule} from '../../../demo/shared/shared.module';
import {ConfigurationComponent} from '../../../@theme/layouts/configuration/configuration.component';
import {OsmDashboard} from '../../../shared/modules/osm-dashboard/osm-dashboard';
import {Action, DashboardConfig} from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {OliveReceptionFormComponent} from './olive-reception-add/olive-reception-form.component';

import {OLIVE_DELIVERY_DASHBOARD} from './OLIVE_DELIVERY_DASHBOARD';
import {OilReceptionComponent} from '../oil-reception/oil-reception.component';

@Component({
  selector: 'app-olive-reception',
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
    OsmDashboard,
    OliveReceptionFormComponent,
    OilReceptionComponent
  ],
  templateUrl: './olive-reception.component.html',
  styleUrls: ['./olive-reception.component.scss']
})
export class OliveReceptionComponent implements OnInit, OnDestroy {
  formOpen = false;
  isEditing = false;
  selectedDelivery?: UnifiedDelivery;
  deliveries: UnifiedDelivery[] = [];
  dashboardConfig: DashboardConfig = OLIVE_DELIVERY_DASHBOARD;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private subs = new Subscription();

  constructor(
    private deliveryService: UnifiedDeliveryService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchDeliveries();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  selectReception(d?: UnifiedDelivery): void {
    if (d?.id) {
      this.router.navigate(['/reception/reception-olive', d.id]);
    } else {
      this.router.navigate(['/reception/reception-olive', 'new']);
    }
  }
  private fetchDeliveries(): void {
    this.subs.add(
      this.deliveryService.getAllDeliveriesList().subscribe((res) => {
        this.deliveries = res.success ? res.data.filter((d) => d.deliveryType === 'OLIVE') : [];
        if (!res.success) this.toast(res.message || 'Erreur lors du chargement des réceptions.');
      })
    );
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['reception/quality', d.id]);
  }

  onRowAction(e: { row: UnifiedDelivery; action: Action }): void {
    switch (e.action.label) {
      case 'Consulter':
        this.viewDelivery(e.row);
        break;
      case 'Modifier':
        this.selectReception(e.row);
        break;
      case 'Controle quality':
      case 'QUALITY':
      case 'Contrôle Qualité':
        this.QualityControl(e.row);
        break;
      case 'Supprimer':
        if (e.row.id) this.deleteDelivery(e.row);
        break;
    }
  }

  private deleteDelivery(d: UnifiedDelivery): void {
    this.subs.add(
      this.deliveryService.deleteUnifiedDelivery(d.id!).subscribe(
        (res) => {
          if (res.success) {
            this.fetchDeliveries();
            this.toast('Réception supprimée avec succès.');
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
      panelClass: ['custom-snackbar']
    });
  }
}
