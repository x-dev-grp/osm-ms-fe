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
import autoTable from "jspdf-autotable";
import { SUPPLIERS_DASHBOARD_CONFIG } from '../suppliers/suppliers-dashboard.config';

/* ──────────────────────────────────────────────────────────── */
/* validators                                                   */
/* ──────────────────────────────────────────────────────────── */

export const netNotGreaterThanGross: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {
  const brut = g.get('poidsBrute')?.value;
  const net = g.get('poidsNet')?.value;
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
        globalLotNumber: [null],

        deliveryDate: [new Date(), Validators.required],
        region: [null, Validators.required],

        poidsBrute: [0, Validators.min(0)],
        poidsNet: [0, Validators.min(0)],

        matriculeCamion: ['', Validators.required],
        etatCamion: ['', Validators.required],

        supplier: [null, Validators.required],

        /* oil-specific details */
        oilVariety: [null],
        oliveType: [null], // still used to stamp the lot code
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
        this.oliveTypes = oliveTypes.success ? oliveTypes.data : [];
        this.regions = regions.success ? regions.data : [];
        this.suppliers = suppliers.success ? suppliers.data : [];
        this.deliveries = deliveries.success ? deliveries.data : [];

        const deliveryCount = this.deliveries.length;
        const maxLot = this.maxLotNumber();

        this.receptionForm.patchValue({
          deliveryNumber: deliveryCount + 1,
          lotNumber: maxLot + 1
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
      .map((d) => d.lotNumber?.replace(/^\D+/, '') ?? '')
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n));
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

  // async Enregistrer(): Promise<void> {
  //   if (this.receptionForm.invalid) {
  //     this.toast('Veuillez remplir tous les champs obligatoires.', 4000);
  //     return;
  //   }
  //
  //   const f = this.receptionForm.value;
  //
  //   if (!f.region?.id)   { this.toast('Veuillez sélectionner une région valide.', 4000);   return; }
  //   if (!f.supplier?.id) { this.toast('Veuillez sélectionner un fournisseur valide.', 4000); return; }
  //
  //   const payload: any = {
  //     id: this.isEditing ? this.selectedReceptionId : undefined,
  //
  //     deliveryType: 'OIL',
  //     deliveryNumber: f.deliveryNumber,
  //     lotNumber:      f.lotNumber,
  //     globalLotNumber:f.globalLotNumber,
  //
  //     deliveryDate: this.iso(f.deliveryDate),
  //     region:       f.region,
  //
  //     poidsBrute: f.poidsBrute,
  //     poidsNet:   f.poidsNet,
  //
  //     matriculeCamion: f.matriculeCamion,
  //     etatCamion:      f.etatCamion,
  //
  //     supplier:   f.supplier,
  //     oilVariety: f.oilVariety,
  //     oliveType:  f.oliveType,
  //
  //     oilQuantity:  f.oilQuantity,
  //     unitPrice:    f.unitPrice,
  //     price:        f.price,
  //     paidAmount:   f.paidAmount,
  //     unpaidAmount: f.unpaidAmount
  //   };
  //
  //   const req$ = this.isEditing
  //     ? this.deliveryService.updateUnifiedDelivery(payload)
  //     : this.deliveryService.createUnifiedDelivery(payload);
  //
  //   req$.subscribe({
  //     next: res => {
  //       if (res.success) {
  //         this.toast(this.isEditing ? 'Réception huile mise à jour.' : 'Réception huile ajoutée.');
  //         this.fetchDeliveries();
  //         this.resetForm();
  //       } else {
  //         this.toast(res.message || "Échec de l'opération.");
  //       }
  //     },
  //     error: () => this.toast(this.isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de l’ajout')
  //   });
  // }

  // resetForm(): void {
  //   this.receptionForm.reset({
  //     deliveryType: 'OIL',
  //     deliveryDate: new Date(),
  //     poidsBrute: 0,
  //     poidsNet: 0
  //   });
  //   this.isEditing = false;
  //   this.formOpen  = false;
  //   this.selectedReceptionId = undefined;
  // }

  /* ——— data loading & table helpers ——— */

  private fetchDeliveries(): void {
    this.deliveryService.getAllDeliveriesList().subscribe((res) => {
      this.deliveries = res.success ? res.data.filter((d) => d.deliveryType === 'OIL') : [];
      if (!res.success) this.toast(res.message || 'Erreur lors du chargement des réceptions.');
    });
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['/reception/quality', d.id]);
  }

  genererBonReception(delivery: UnifiedDelivery): void {
    const doc = new jsPDF();

    let currentY = 10;

    // --- HEADER ---

    // Logo placeholder
    doc.setFontSize(10);
    doc.rect(10, currentY, 30, 20);
    doc.text('Logo', 15, currentY + 10);

    // Tableau titre + référence
    const headerLeft = 45;
    const headerWidth = 160;
    const headerCellHeight = 8;

    doc.setFillColor(200, 200, 200); // Gris foncé pour le header
    doc.rect(headerLeft, currentY, headerWidth, headerCellHeight, 'F');
    doc.text('Formulaire', headerLeft + headerWidth / 2, currentY + 5, {align: 'center'});
    currentY += headerCellHeight;

    doc.rect(headerLeft, currentY, headerWidth / 2, headerCellHeight);
    doc.rect(headerLeft + headerWidth / 2, currentY, headerWidth / 2, headerCellHeight);
    doc.text(`Bon De Réception Huile`, headerLeft + 5, currentY + 5);
    doc.text(`Référence : ${delivery.deliveryNumber || ''}`, headerLeft + headerWidth / 2 + 5, currentY + 5);
    currentY += headerCellHeight;

    doc.rect(headerLeft, currentY, headerWidth / 2, headerCellHeight);
    doc.rect(headerLeft + headerWidth / 2, currentY, headerWidth / 2, headerCellHeight);
    doc.text(`N° : ${delivery.deliveryNumber || ''}`, headerLeft + 5, currentY + 5);
    doc.text(`Date : ${new Date(delivery.deliveryDate).toLocaleDateString()}`, headerLeft + headerWidth / 2 + 5, currentY + 5);
    currentY += headerCellHeight;

    doc.rect(headerLeft, currentY, headerWidth / 2, headerCellHeight);
    doc.rect(headerLeft + headerWidth / 2, currentY, headerWidth / 2, headerCellHeight);
    doc.text('Page : 1/1', headerLeft + 5, currentY + 5);
    doc.text('Révision : 01', headerLeft + headerWidth / 2 + 5, currentY + 5);
    currentY += headerCellHeight;

    doc.line(10, currentY + 10, 200, currentY + 10);
    currentY += 20;

    // --- INFOS LIVRAISON ---

    doc.setFontSize(11);
    doc.text(`Type : ${delivery.deliveryType || ''}`, 10, currentY);
    currentY += 7;

    doc.text(
      `Fournisseur : ${(delivery.supplier?.supplierInfo?.name || '') + ' ' + (delivery.supplier?.supplierInfo?.lastname || '')}`,
      10,
      currentY
    );
    currentY += 7;

    doc.text(`Téléphone : ${delivery.supplier?.supplierInfo?.phone || ''}`, 10, currentY);
    currentY += 7;

    doc.text(`Adresse : ${delivery.supplier?.supplierInfo?.address || ''}`, 10, currentY);
    currentY += 14;

    // --- TABLEAU INFOS LIVRAISON ---

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

    autoTable(doc, {
      startY: currentY,
      head: [['Champ', 'Valeur']],
      body: tableData,
      theme: 'grid',
      styles: {fontSize: 10},
      margin: {left: 10, right: 10},
      headStyles: {fillColor: [211, 211, 211]}, //  Gris clair : #D3D3D3
      bodyStyles: {fillColor: [255, 255, 255]} // Fond blanc pour les lignes
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- CONTRÔLE QUALITÉ (optionnel) ---
    if (
      delivery.qualityControlResults &&
      Array.isArray(delivery.qualityControlResults) &&
      delivery.qualityControlResults.length > 0
    ) {
      const qcData = delivery.qualityControlResults
        .filter(qc => qc.rule && qc.measuredValue != null)
        .map(qc => [qc.rule.ruleName || qc.rule.ruleKey, qc.measuredValue]);

      // Ajoute un titre <h2> centré pour "Contrôle Qualité"
      doc.setFont('helvetica', 'bold'); // Titre en gras
      doc.text('Contrôle Qualité', 100, currentY, {align: 'center'});
      currentY += 10; // Espacement après le titre

      autoTable(doc, {
        startY: currentY,
        head: [['Critère', 'Valeur']],
        body: qcData,
        theme: 'grid',
        styles: {fontSize: 10},
        margin: {left: 10, right: 10},
        headStyles: {fillColor: [200, 200, 200]},
        bodyStyles: {fillColor: [255, 255, 255]}
      });
    }

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
    this.deliveryService.deleteUnifiedDelivery(d.id!).subscribe(
      (res) => {
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
    const parseDate = (v: any): Date | null => (!v ? null : v instanceof Date ? v : new Date(v));

    this.receptionForm.patchValue({
      ...d,
      deliveryType: 'OIL',
      deliveryDate: parseDate(d.deliveryDate),
      region: this.regions.find((r) => r.id === d.region?.id) || null,
      supplier: this.suppliers.find((s) => s.id === d.supplier?.id) || null,
      oilVariety: this.oilVarieties.find((v) => v.id === d.oilVariety?.id) || null,
      oliveType: this.oliveTypes.find((t) => t.id === d.oliveType?.id) || null
    });
  }

  private setupOliveTypeSubscription(): void {
    const sub = this.receptionForm.get('oliveType')!.valueChanges.subscribe((ol: BaseType | null) => {
      const num = this.receptionForm.get('deliveryNumber')?.value || this.deliveries.length + 1;
      const lot = this.generateLotNumber(ol, num);
      this.receptionForm.patchValue({ lotNumber: lot }, { emitEvent: false });
    });
    this.subs.add(sub);
  }

  private setupAutoCalculations(): void {
    const qty$ = this.receptionForm.get('oilQuantity')!.valueChanges;
    const unit$ = this.receptionForm.get('unitPrice')!.valueChanges;
    const paid$ = this.receptionForm.get('paidAmount')!.valueChanges;

    this.subs.add(
      combineLatest([qty$, unit$]).subscribe(([q, u]) => {
        const price = (q || 0) * (u || 0);
        this.receptionForm.patchValue({ price }, { emitEvent: false });
      })
    );

    this.subs.add(
      combineLatest([this.receptionForm.get('price')!.valueChanges, paid$]).subscribe(([price, paid]) => {
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
