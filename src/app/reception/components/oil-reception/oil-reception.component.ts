import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatCardModule} from '@angular/material/card';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {MatSortModule} from '@angular/material/sort';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {combineLatest, forkJoin, Subscription} from 'rxjs';

import {SharedModule} from '../../../demo/shared/shared.module';
import {ConfigurationComponent} from '../../../@theme/layouts/configuration/configuration.component';
import {OsmDashboard} from '../../../shared/modules/osm-dashboard/osm-dashboard';
import {Action, DashboardConfig} from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {BaseType} from '../../../shared/models/base-type';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {GenericTypeService} from '../../../shared/services/generic-type.service';
import {TypeCategory} from '../../../shared/models/type-category.enum';
import {SupplierType} from '../../../shared/models/supplier-type';
import {SupplierTypeService} from '../../../shared/services/supplier.service';


import jsPDF from 'jspdf';


import {OIL_DELIVERY_DASHBOARD} from './OIL_DELIVERY_DASHBOARD';

/* ──────────────────────────────────────────────────────────── */
/* validators                                                   */
/* ──────────────────────────────────────────────────────────── */

export const netNotGreaterThanGross: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {
  const brut = g.get('poidsBrute')?.value;
  const net  = g.get('poidsNet')?.value;
  return brut != null && net != null && net > brut ? { netGreater: true } : null;
};

/* ──────────────────────────────────────────────────────────── */
/* component                                                    */
/* ──────────────────────────────────────────────────────────── */

@Component({
  selector: 'app-oil-reception',
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
    MatDatepickerModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    ConfigurationComponent,
    OsmDashboard
  ],
  templateUrl: './oil-reception.component.html',
  styleUrl: './oil-reception.component.scss'
})
export class OilReceptionComponent implements OnInit, OnDestroy {
  /* ——— state ——— */
  loading = false;
  formOpen = false;
  isEditing = false;
  selectedReceptionId?: string;

  deliveries: UnifiedDelivery[] = [];
  receptionForm: FormGroup;

  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oilVarieties: BaseType[] = [];
  oliveTypes: BaseType[] = [];

  dashboardConfig: DashboardConfig = OIL_DELIVERY_DASHBOARD;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.receptionForm = this.fb.group(
      {
        /* core fields */
        deliveryType: ['OIL', Validators.required],
        deliveryNumber: ['', Validators.required],
        lotNumber: ['', Validators.required],
        globalLotNumber: [''],

        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],

        poidsBrute: [0, Validators.min(0)],
        poidsNet: [0, Validators.min(0)],

        matriculeCamion: ['', Validators.required],
        etatCamion: ['', Validators.required],

        supplier: [null, Validators.required],

        /* oil-specific details */
        oilVariety: [null],
        oliveType: [null],           // still used to stamp the lot code
        oilQuantity: [null, Validators.min(0)],
        unitPrice: [null, Validators.min(0)],
        price: [null, Validators.min(0)],
        paidAmount: [null, Validators.min(0)],
        unpaidAmount: [null, Validators.min(0)]
      },
      { validators: netNotGreaterThanGross }
    );
  }

  /* ——— lifecycle ——— */

  ngOnInit(): void {
    this.loading = true;

    forkJoin([
      this.genericTypeService.getAllTypes(TypeCategory.OIL_VARIETY),
      this.genericTypeService.getAllTypes(TypeCategory.OLIVE_TYPE),
      this.genericTypeService.getAllTypes(TypeCategory.REGION),
      this.supplierService.getAllSuppliers(),
      this.deliveryService.getAllDeliveriesList()
    ]).subscribe({
      next: ([oilVarieties, oliveTypes, regions, suppliers, deliveries]) => {
        this.oilVarieties = oilVarieties.success ? oilVarieties.data : [];
        this.oliveTypes   = oliveTypes.success ? oliveTypes.data   : [];
        this.regions      = regions.success    ? regions.data      : [];
        this.suppliers    = suppliers.success  ? suppliers.data    : [];
        this.deliveries   = deliveries.success ? deliveries.data   : [];

        const deliveryCount = this.deliveries.length;
        const maxLot        = this.maxLotNumber();

        this.receptionForm.patchValue({
          deliveryNumber: deliveryCount + 1,
          lotNumber:      maxLot + 1
        });

        this.setupOliveTypeSubscription();
        this.setupAutoCalculations();

        this.loading = false;
      },
      error: () => {
        this.toast('Erreur lors du chargement des données initiales.');
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /* ——— helpers ——— */

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['custom-snackbar']
    });
  }

  private maxLotNumber(): number {
    const nums = this.deliveries
      .map(d => d.lotNumber?.replace(/^\D+/, '') ?? '')
      .map(n => parseInt(n, 10))
      .filter(n => !isNaN(n));
    return nums.length ? Math.max(...nums) : 0;
  }

  private iso(date: Date | string | null): string | null {
    return date ? new Date(date).toISOString() : null;
  }

  /* ——— UI actions ——— */

  selectReception(d?: UnifiedDelivery): void {
    if (d?.id) {
      this.router.navigate(['/reception/reception-huile', d.id]);
    } else {
      this.router.navigate(['/reception/reception-huile', 'new']);
    }
  }

  async Enregistrer(): Promise<void> {
    if (this.receptionForm.invalid) {
      this.toast('Veuillez remplir tous les champs obligatoires.', 4000);
      return;
    }

    const f = this.receptionForm.value;

    if (!f.region?.id)   { this.toast('Veuillez sélectionner une région valide.', 4000);   return; }
    if (!f.supplier?.id) { this.toast('Veuillez sélectionner un fournisseur valide.', 4000); return; }

    const payload: any = {
      id: this.isEditing ? this.selectedReceptionId : undefined,

      deliveryType: 'OIL',
      deliveryNumber: f.deliveryNumber,
      lotNumber:      f.lotNumber,
      globalLotNumber:f.globalLotNumber,

      deliveryDate: this.iso(f.deliveryDate),
      region:       f.region,

      poidsBrute: f.poidsBrute,
      poidsNet:   f.poidsNet,

      matriculeCamion: f.matriculeCamion,
      etatCamion:      f.etatCamion,

      supplier:   f.supplier,
      oilVariety: f.oilVariety,
      oliveType:  f.oliveType,

      oilQuantity:  f.oilQuantity,
      unitPrice:    f.unitPrice,
      price:        f.price,
      paidAmount:   f.paidAmount,
      unpaidAmount: f.unpaidAmount
    };

    const req$ = this.isEditing
      ? this.deliveryService.updateUnifiedDelivery(payload)
      : this.deliveryService.createUnifiedDelivery(payload);

    req$.subscribe({
      next: res => {
        if (res.success) {
          this.toast(this.isEditing ? 'Réception huile mise à jour.' : 'Réception huile ajoutée.');
          this.fetchDeliveries();
          this.resetForm();
        } else {
          this.toast(res.message || "Échec de l'opération.");
        }
      },
      error: () => this.toast(this.isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de l’ajout')
    });
  }

  resetForm(): void {
    this.receptionForm.reset({
      deliveryType: 'OIL',
      deliveryDate: new Date(),
      poidsBrute: 0,
      poidsNet: 0
    });
    this.isEditing = false;
    this.formOpen  = false;
    this.selectedReceptionId = undefined;
  }

  /* ——— data loading & table helpers ——— */

  private fetchDeliveries(): void {
    this.deliveryService.getAllDeliveriesList().subscribe(res => {
      this.deliveries = res.success ? res.data.filter(d => d.deliveryType === 'OIL') : [];
      if (!res.success) this.toast(res.message || 'Erreur lors du chargement des réceptions.');
    });
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['/reception/quality', d.id]);
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
    doc.text(`Bon De Réception Huile`, headerTableLeft + 5, currentY + 5);
    doc.text(`Référence : ${delivery.deliveryNumber || ''}`, headerTableLeft + headerColWidth + 5, currentY + 5);
    currentY += headerCellHeight;

    // Third row: N° and Date
    doc.rect(headerTableLeft, currentY, headerColWidth, headerCellHeight); // Left cell
    doc.rect(headerTableLeft + headerColWidth, currentY, headerColWidth, headerCellHeight); // Right cell
    doc.text(`N° : ${delivery.deliveryNumber || ''}`, headerTableLeft + 5, currentY + 5);
    doc.text(`Date : ${new Date(delivery.deliveryDate || Date.now()).toLocaleDateString()}`, headerTableLeft + headerColWidth + 5, currentY + 5);
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
    doc.text(`Fournisseur : ${(delivery.supplier?.supplierInfo?.name || '') + ' ' + (delivery.supplier?.supplierInfo?.lastname || '')}`, 10, y);
    y += 7;
    doc.text(`Téléphone : ${delivery.supplier?.supplierInfo?.phone || ''}`, 10, y);
    y += 7;
    doc.text(`Adresse : ${delivery.supplier?.supplierInfo?.address || ''}`, 10, y);
    y += 14; // Extra space before table

    // Manual Table: Remaining values
    const tableData = [
      ['Lot', delivery.lotNumber || ''],
      ['Lot Global', delivery.globalLotNumber || ''],
      ['Quantité d\'huile', `${delivery.oilQuantity || ''} L`],
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
    tableData.forEach(row => {
      doc.rect(tableLeft, rowY, colWidth, cellHeight);
      doc.rect(tableLeft + colWidth, rowY, colWidth, cellHeight);
      doc.text(row[0], tableLeft + 2, rowY + 5);
      doc.text(row[1] || '', tableLeft + colWidth + 2, rowY + 5); // Fallback to empty string
      rowY += cellHeight;
    });

    // Open in a new tab
    window.open(doc.output('bloburl'), '_blank');
  }

  onRowAction(e: { row: UnifiedDelivery; action: Action }): void {
    switch (e.action.value) {
      case 'Consulter':
        this.viewDelivery(e.row);
        break;

      case 'Modifier':
        this.selectReception(e.row);
        break;

      case 'QUALITY':
      case 'Contrôle Qualité':
        this.QualityControl(e.row);
        break;

      case 'Supprimer':
        if (e.row.id) this.deleteDelivery(e.row);
        break;

      case 'generer_pdf':
        if (e.row) {
          this.genererBonReception(e.row);
        }
        break;
    }
  }


  private deleteDelivery(d: UnifiedDelivery): void {
    this.deliveryService.deleteUnifiedDelivery(d.id!).subscribe(
      res => {
        if (res.success) {
          this.fetchDeliveries();
          this.toast('Réception supprimée avec succès.');
        }
      },
      () => this.toast('Erreur lors de la suppression.')
    );
  }

  /* ——— form patch & subscriptions ——— */

  private patchForm(d: UnifiedDelivery): void {
    const parseDate = (v: any): Date | null =>
      !v ? null : v instanceof Date ? v : new Date(v);

    this.receptionForm.patchValue({
      ...d,
      deliveryType: 'OIL',
      deliveryDate: parseDate(d.deliveryDate),
      region     : this.regions  .find(r => r.id === d.region?.id)   || null,
      supplier   : this.suppliers.find(s => s.id === d.supplier?.id) || null,
      oilVariety : this.oilVarieties.find(v => v.id === d.oilVariety?.id) || null,
      oliveType  : this.oliveTypes.find(t => t.id === d.oliveType?.id)    || null
    });
  }

  private setupOliveTypeSubscription(): void {
    const sub = this.receptionForm.get('oliveType')!
      .valueChanges.subscribe((ol: BaseType | null) => {
        const num = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
        const lot = this.generateLotNumber(ol, num);
        this.receptionForm.patchValue({ lotNumber: lot }, { emitEvent: false });
      });
    this.subs.add(sub);
  }

  private setupAutoCalculations(): void {
    const qty$  = this.receptionForm.get('oilQuantity')!.valueChanges;
    const unit$ = this.receptionForm.get('unitPrice')!.valueChanges;
    const paid$ = this.receptionForm.get('paidAmount')!.valueChanges;

    this.subs.add(
      combineLatest([qty$, unit$]).subscribe(([q, u]) => {
        const price = (q || 0) * (u || 0);
        this.receptionForm.patchValue({ price }, { emitEvent: false });
      })
    );

    this.subs.add(
      combineLatest([this.receptionForm.get('price')!.valueChanges, paid$])
        .subscribe(([price, paid]) => {
          const unpaid = (price || 0) - (paid || 0);
          this.receptionForm.patchValue({ unpaidAmount: unpaid }, { emitEvent: false });
        })
    );
  }

  private generateLotNumber(ol: BaseType | null, num: number): string {
    if (!ol?.name) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    const nStr = num.toString().padStart(4, '0');
    return `${nStr}${ol.name.toUpperCase()}${year}`;
  }
}
