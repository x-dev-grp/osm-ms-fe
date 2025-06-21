import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { SharedModule } from '../../../demo/shared/shared.module';
import { OsmDashboard } from '../../../shared/modules/osm-dashboard/osm-dashboard';
import { DashboardConfig } from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import { UnifiedDelivery } from '../../../shared/models/UnifiedDelivery';
import { UnifiedDeliveryService } from '../../../shared/services/delivery.service';
import { OliveReceptionFormComponent } from './olive-reception-add/olive-reception-form.component';

import {OLIVE_DELIVERY_DASHBOARD} from './OLIVE_DELIVERY_DASHBOARD';
import {PdfGeneratorService} from "../../../shared/services/pdf-generator.service";
import jsPDF from 'jspdf';

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
    OsmDashboard,
    OliveReceptionFormComponent
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
    private router: Router,
    private pdfService: PdfGeneratorService,
    private translate: TranslateService
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
        if (!res.success) this.toast(this.translate.instant('DELIVERIES.MESSAGES.LOAD_ERROR'));
      })
    );
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['reception/quality', d.id]);
  }

  genererBonReception(delivery: UnifiedDelivery) {
    const doc = new jsPDF();

    // Header: Logo placeholder (left)
    doc.setFontSize(10);
    doc.rect(10, 10, 30, 20); // Placeholder for logo
    doc.text('Logo', 15, 20); // Text indicating logo position

    // Header: Create a table for the title and details
    const headerTableTop = 10;
    const headerTableLeft = 45; // Starting position of the table
    const headerTableWidth = 160; // Width of the table
    const headerCellHeight = 8; // Height of each cell
    const headerColWidth = headerTableWidth / 2; // Width of each column

    // Draw the header table
    let currentY = headerTableTop;

    // First row: Formulaire
    doc.setFillColor(200, 200, 200); // Light gray background for the first row
    doc.rect(headerTableLeft, currentY, headerTableWidth, headerCellHeight, 'F');
    doc.text('Formulaire', headerTableLeft + headerColWidth, currentY + 5, {align: 'center'});
    currentY += headerCellHeight;

    // Second row: Bon De Réception and Référence
    doc.rect(headerTableLeft, currentY, headerColWidth, headerCellHeight); // Left cell
    doc.rect(headerTableLeft + headerColWidth, currentY, headerColWidth, headerCellHeight); // Right cell
    doc.text(`Bon De Réception Olive`, headerTableLeft + 5, currentY + 5);
    doc.text(`Référence : ${delivery.lotNumber || ''}`, headerTableLeft + headerColWidth + 5, currentY + 5);
    currentY += headerCellHeight;

    // Third row: N° and Date
    doc.rect(headerTableLeft, currentY, headerColWidth, headerCellHeight); // Left cell
    doc.rect(headerTableLeft + headerColWidth, currentY, headerColWidth, headerCellHeight); // Right cell
    doc.text(`N° : ${delivery.deliveryNumber || ''}`, headerTableLeft + 5, currentY + 5);
    doc.text(
      `Date : ${new Date(delivery.deliveryDate || Date.now()).toLocaleDateString()}`,
      headerTableLeft + headerColWidth + 5,
      currentY + 5
    );
    currentY += headerCellHeight;

    // Fourth row: Page and Révision
    doc.rect(headerTableLeft, currentY, headerColWidth, headerCellHeight); // Left cell
    doc.rect(headerTableLeft + headerColWidth, currentY, headerColWidth, headerCellHeight); // Right cell
    doc.text('Page : 1/1', headerTableLeft + 5, currentY + 5);
    doc.text('Révision : 01', headerTableLeft + headerColWidth + 5, currentY + 5);

    // Separator line
    doc.line(10, currentY + 10, 200, currentY + 10);

    // Body: Standalone values
    doc.setFontSize(11);
    let y = currentY + 20;
    doc.text(`Type : ${delivery.deliveryType || ''}`, 10, y);
    y += 7;
    doc.text(
      `Fournisseur : ${(delivery.supplier?.supplierInfo?.name || '') + ' ' + (delivery.supplier?.supplierInfo?.lastname || '')}`,
      10,
      y
    );
    y += 7;
    doc.text(`Téléphone : ${delivery.supplier?.supplierInfo?.phone || ''}`, 10, y);
    y += 7;
    doc.text(`Adresse : ${delivery.supplier?.supplierInfo?.address || ''}`, 10, y);
    y += 14; // Extra space before table

    // Manual Table: Remaining values
    const tableData = [
      ['Lot', delivery.lotNumber || ''],
      ['Lot Global', delivery.globalLotNumber || ''],
      ["Quantité d'huile", `${delivery.oilQuantity || ''} L`],
      ['Poids Net', `${delivery.poidsNet || ''} kg`],
      ['Poids Brut', `${delivery.poidsBrute || ''} kg`],
      ['Prix total', `${delivery.price || ''} TND`],
      ['Montant payé', `${delivery.paidAmount || ''} TND`],
      ['Montant impayé', `${delivery.unpaidAmount || ''} TND`],
      ['Matricule camion', delivery.matriculeCamion || ''],
      ['État camion', delivery.etatCamion || ''],
      ['Région', delivery.region?.name || '']
    ];

    const tableTop = y;
    const tableLeft = 10;
    const tableWidth = 180;
    const cellHeight = 7;
    const colWidth = tableWidth / 2;

    // Draw table header
    doc.setFillColor(200, 200, 200);
    doc.rect(tableLeft, tableTop, colWidth, cellHeight, 'F');
    doc.rect(tableLeft + colWidth, tableTop, colWidth, cellHeight, 'F');
    doc.text('Champ', tableLeft + 2, tableTop + 5);
    doc.text('Valeur', tableLeft + colWidth + 2, tableTop + 5);

    // Draw table rows
    let rowY = tableTop + cellHeight;
    tableData.forEach((row) => {
      doc.rect(tableLeft, rowY, colWidth, cellHeight);
      doc.rect(tableLeft + colWidth, rowY, colWidth, cellHeight);
      doc.text(row[0], tableLeft + 2, rowY + 5);
      doc.text(row[1] || '', tableLeft + colWidth + 2, rowY + 5); // Fallback to empty string
      rowY += cellHeight;
    });

    // Open in a new tab
    window.open(doc.output('bloburl'), '_blank');
  }

  onRowAction(e: { row: UnifiedDelivery; action: string }): void {
    switch (e.action) {
      case 'READ':
        this.viewDelivery(e.row);
        break;
      case 'UPDATE':
        this.selectReception(e.row);
        break;
      case 'QUALITY':
        this.QualityControl(e.row);
        break;
      case 'DELETE':
        if (e.row.id) this.deleteDelivery(e.row);
        break;
      case 'GENPDF':
        if (e.row) {
          this.genererBonReception(e.row);
        }
        break;
    }
  }

  private deleteDelivery(d: UnifiedDelivery): void {
    this.subs.add(
      this.deliveryService.deleteUnifiedDelivery(d.id!).subscribe(
        (res) => {
          if (res.success) {
            this.fetchDeliveries();
            this.toast(this.translate.instant('DELIVERIES.MESSAGES.DELETE_SUCCESS'));
          }
        },
        () => this.toast(this.translate.instant('DELIVERIES.MESSAGES.DELETE_ERROR'))
      )
    );
  }

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, this.translate.instant('STANDARD.BTNS.CANCEL'), {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['']
    });
  }
}
