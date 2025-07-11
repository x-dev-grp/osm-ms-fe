import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
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
import {DashboardConfig} from '../../../shared/modules/osm-dashboard/models/dashboard-config';
import {UnifiedDelivery} from '../../../shared/models/UnifiedDelivery';
import {BaseType} from '../../../shared/models/base-type';
import {UnifiedDeliveryService} from '../../../shared/services/delivery.service';
import {GenericTypeService} from '../../../shared/services/generic-type.service';
import {TypeCategory} from '../../../shared/models/type-category.enum';
import {SupplierType} from '../../../shared/models/supplier-type';
import {SupplierTypeService} from '../../../shared/services/supplier.service';

import {PdfGeneratorService} from '../../../shared/services/pdf-generator.service';
import {OIL_DELIVERY_DASHBOARD} from './OIL_DELIVERY_DASHBOARD';


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
  @ViewChild('setPriceDialog') setPriceDialogTemplate!: TemplateRef<any>;

  /* ——— state ——— */
  loading = false;
  isEditing = false;

  deliveries: UnifiedDelivery[] = [];
  receptionForm: FormGroup;

  regions: BaseType[] = [];
  suppliers: SupplierType[] = [];
  oilVarieties: BaseType[] = [];
  oliveTypes: BaseType[] = [];
  setPriceForm!: FormGroup;
  isLoading: boolean = false;

  dashboardConfig: DashboardConfig = OIL_DELIVERY_DASHBOARD;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  selectedRow: any;

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private deliveryService: UnifiedDeliveryService,
    private genericTypeService: GenericTypeService,
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar,
    private router: Router,
    private pdfService: PdfGeneratorService,
    private dialog: MatDialog
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

  selectReception(d?: UnifiedDelivery): void {
    if (d?.id) {
      this.router.navigate(['/reception/reception-huile', d.id]);
    } else {
      this.router.navigate(['/reception/reception-huile', 'new']);
    }
  }

  viewDelivery(d: UnifiedDelivery): void {
    this.router.navigate(['reception/reception-details', d.id]);
  }

  QualityControl(d: UnifiedDelivery): void {
    this.router.navigate(['/reception/quality', d.id]);
  }

  /* ——— UI actions ——— */

  genererBonReception(delivery: UnifiedDelivery): void {
    const bonReceptionData = {
      title: 'Bon De Réception Huile',
      reference: delivery.lotNumber || '',
      date: '',
      revision: '01',
      page: '1/1',
      generalInfo: [
        { label: 'Type', value: delivery.deliveryType || '' },
        {
          label: 'Fournisseur',
          value: `${delivery.supplier?.supplierInfo?.name || ''} ${delivery.supplier?.supplierInfo?.lastname || ''}`
        },
        { label: 'Téléphone', value: delivery.supplier?.supplierInfo?.phone || '' },
        { label: 'Adresse', value: delivery.supplier?.supplierInfo?.address || '' }
      ],
      fields: [
        { label: 'Lot', value: delivery.lotNumber || '' },
        { label: 'Lot Global', value: delivery.globalLotNumber || '' },
        { label: 'Poids Brut', value: `${delivery.poidsBrute || ''} kg` },
        { label: "Quantité d'huile", value: `${delivery.oilQuantity || ''} kg` },
        { label: 'Variéte Huile', value: `${delivery.oilVariety?.name || ''} ` },
        { label: 'Type Huile', value: `${delivery.oilType?.name || ''} ` },
        { label: 'Région', value: delivery.region?.name || '' }
      ],
      footerInfo: [
        { label: 'Signature Agent (bascule) ', placeholder: '' },
        { label: 'Signature Réspensable CQ', placeholder: '' }
      ],
      fileName: `Bon_Reception_Huile_${delivery.deliveryNumber || 'inconnu'}.pdf`
    };

    this.pdfService.generatePdfDocument(bonReceptionData);
  }


  /* ——— data loading & table helpers ——— */

  onRowAction(e: { row: UnifiedDelivery; action: string }): void {
    switch (e.action) {
      case 'READ':
        this.viewDelivery(e.row);
        break;

      case 'UPDATE':
        this.selectReception(e.row);
        break;

      case 'QUALITY':
      case 'OIL_QUALITY':
      case 'UPDATE_OIL_QUALITY':
        this.QualityControl(e.row);
        break;

      case 'DELETE':
        if (e.row.id) this.deleteDelivery(e.row);
        break;

      case 'SET_PRICE':
        this.setPrice(e.row);
        break;

      case 'GEN_PDF':
        if (e.row) {
          this.genererBonReception(e.row);
        }
        break;
    }
  }

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

  private fetchDeliveries(): void {
    this.deliveryService.getAllDeliveriesList().subscribe((res) => {
      this.deliveries = res.success ? res.data.filter((d) => d.deliveryType === 'OIL') : [];
      if (!res.success) this.toast(res.message || 'Erreur lors du chargement des réceptions.');
    });
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

  confirmPrice(dialogRef: any): void {
    if (!this.setPriceForm.valid || !this.selectedRow) return;

    // Met à jour les champs
    this.selectedRow.unitPrice = this.setPriceForm.get('unitPrice')?.value;
    this.selectedRow.price = this.setPriceForm.get('price')?.value;

    this.isLoading = true;

    this.deliveryService.updatePricing(this.selectedRow.id,this.selectedRow.unitPrice).subscribe({
      next: () => {
         dialogRef.close(); // Ferme le dialog après succès
        this.isLoading = false;
        this.snackBar.open('Prix mis à jour avec succès.', 'Fermer', {
          duration: 3000,
          panelClass: ['mat-snack-bar-container-success']
        });
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'enregistrement du prix.', 'Fermer', {
          duration: 4000,
          panelClass: ['mat-snack-bar-container-error']
        });
        this.isLoading = false;
      }
    });
  }

  private setPrice(row: any): void {
    this.selectedRow = row;

    this.setPriceForm = this.fb.group({
      unitPrice: [row.unitPrice || null, Validators.required],
      price: [{value: row.price || null, disabled: true}, Validators.required]
    });

    // Mettre à jour automatiquement le prix
    this.setPriceForm.get('unitPrice')?.valueChanges.subscribe(unitPrice => {
      const quantity = row.oilQuantity || 0; // adapte selon ton modèle
      const price = parseFloat(unitPrice) * quantity;
      this.setPriceForm.get('price')?.setValue(+price.toFixed(3));
    });

    this.dialog.open(this.setPriceDialogTemplate, {
      width: '500px',
      data: row,
      disableClose: true,
      panelClass: 'set-price-dialog'
    });
  }

}
