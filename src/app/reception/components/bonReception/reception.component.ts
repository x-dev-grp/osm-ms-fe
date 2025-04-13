import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../demo/shared/shared.module';
import { ConfigurationComponent } from '../../../@theme/layouts/configuration/configuration.component';
import { Delivery } from '../../../osm/models/delivery';
import { StorageUnitDto } from '../../../osm/models/StorageUnitDto';
import { BaseType } from '../../../osm/models/base-type';
 import { QualityControlRule } from '../../../osm/models/quality-control-rule';
import { DeliveryService } from '../../../osm/services/delivery.service';
import { StorageUnitDtoService } from '../../../osm/services/storage.service';
import { SupplierTypeService } from '../../../osm/services/supplier-type.service';
import { GenericTypeService } from '../../../osm/services/generic-type.service';
import { QualityControlRuleService } from '../../../osm/services/quality-control-rule.service';
import { MillMachineService } from '../../../osm/services/mill-machine.service';
import { MillMachine } from '../../../osm/models/millMachine';
import { TypeCategory } from '../../../osm/models/type-category.enum';
import { deliveryType } from '../../../osm/models/deleveryType';
import { TransporterService } from '../../../osm/services/TransporterService';
import { Transporter } from '../../../osm/models/Transporter';
import { OliveLotStatus } from '../../../osm/models/OliveLotStatus';
import { SupplierType } from '../../../osm/models/supplier-type';

@Component({
  selector: 'app-bonreception',
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
  templateUrl: './reception.component.html',
  styleUrl: './reception.component.scss'
})
export class BonReceptionComponent {
  deliveries: Delivery[] = [];
  displayedColumns: string[] = [
    'receiptNumber',
    'lotNumber',
    'globalLotNumber',
    'fournisseur',
    'deliveryDate',
    'oliveQuantity',
    'oilQuantity',
    'status',
    'actions'
  ];
  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<never>;
  currentDelivery: Delivery | null = null;
  deliveryForm!: FormGroup;
  isEditing: boolean = false;
  message: string = '';
  storageUnits: StorageUnitDto[] = [];
  formOpen = false;
  selectedDelivery: Delivery = this.getEmptyDelivery();
  oilTypes: BaseType[] = [];
  suppliers: SupplierType[] = [];
  regions: BaseType[] = [];
  oliveVarieties: BaseType[] = [];
  varieties: BaseType[] = [];
  applyQualityControl: boolean = false;
  qualityControlRules: QualityControlRule[] = [];
  FilterSource: MatTableDataSource<Delivery> = new MatTableDataSource(this.deliveries);
  millingMachines: MillMachine[] = [];
  deliveryTypes: deliveryType;
  statuses: OliveLotStatus;
  oliveTypes: BaseType[] = [];
  protected readonly Object = Object;
  protected transporters: Transporter[];

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private storageUnitsService: StorageUnitDtoService,
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private qualityControlRuleService: QualityControlRuleService,
    private transporterService: TransporterService,
    private millingMachineService: MillMachineService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadSuppliers();
    this.loadMillingMachines();
    this.loadRegions();
    this.loadTransporters();
    this.loadOLIVEVARIETY();
    this.loadOIL_VARIETY();
    this.loadOLIVE_TYPE();
    this.loadProductionMethod();
    this.loadStorageUnits();
  }

  openDialog(delivery?: Delivery) {
    this.currentDelivery = delivery || this.getEmptyDelivery();
    this.initForm(this.currentDelivery);
    this.dialog.open(this.dialogTemplate, { width: '600px' });
  }

  initForm(delivery: Delivery) {
    this.deliveryForm = this.fb.group({
      receiptNumber: [delivery.receiptNumber, Validators.required],
      lotNumber: [delivery.lotNumber, Validators.required],
      globalLotNumber: [delivery.globalLotNumber],
      supplier: [delivery.supplierType, Validators.required],
      deliveryDate: [delivery.deliveryDate, Validators.required],
      status: [delivery.status, Validators.required],
      oliveQuantity: [delivery.oliveQuantity, [Validators.required, Validators.min(1)]],
      oilQuantity: [delivery.oilQuantity],
      deliveryType: [delivery.deliveryType, Validators.required],
      sackCount: [delivery.sackCount],
      transporter: [delivery.transporter],
      millingMachine: [delivery.millingMachine],
      storageUnit: [delivery.storageUnit],
      region: [delivery.region],
      oliveVariety: [delivery.oliveVariety],
      oilType: [delivery.oilType],
      oilVariety: [delivery.oilVariety],
      tierOrBase: [delivery.tierOrBase],
      parcel: [delivery.parcel],
      unitPrice: [delivery.unitPrice],
      price: [delivery.price],
      paidAmount: [delivery.paidAmount],
      unpaidAmount: [delivery.unpaidAmount]
    });
  }

  cancelReception() {
    this.formOpen = false;
    this.selectedDelivery = this.getEmptyDelivery();
  }

  getEmptyDelivery(): Delivery {
    return {
      receiptNumber: '',
      lotNumber: '',
      globalLotNumber: '',
      deliveryDate: '',
      trtDate: '',
      status: OliveLotStatus.NEW,
      deliveryType: deliveryType.OIL,
      oliveQuantity: 0,
      oilQuantity: 0,
      sackCount: 0,
      supplierType: undefined,
      transporter: undefined,
      millingMachine: undefined,
      storageUnit: undefined,
      region: undefined,
      oliveVariety: undefined,
      oilType: undefined,
      oilVariety: undefined,
      tierOrBase: '',
      parcel: '',
      unitPrice: 0,
      price: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      qualityControlResults: []
    };
  }

  onSelectRegion(regionId: string) {
    this.selectedDelivery.region = { id: regionId } as BaseType;
  }

  onSelectOilType(oilTypeId: string) {
    this.selectedDelivery.oilType = { id: oilTypeId } as BaseType;
  }

  onSelectMillMachine(millId: string) {
    this.selectedDelivery.millingMachine = { id: millId } as MillMachine;
  }

  // onSelectSupplier(supplierId: string) {
  //   this.selectedDelivery.supplierType = { genericSupplierType.id: supplierId } as SupplierType;
  // }

  onSelectStorageUnit(unitId: string) {
    this.selectedDelivery.storageUnit = { id: unitId } as StorageUnitDto;
  }

  onSelectOliveVariety(varId: string) {
    this.selectedDelivery.oliveVariety = { id: varId } as BaseType;
  }

  onSubmitNewDelivery() {
    if (this.deliveryForm.invalid) {
      console.error('Form is invalid');
      return;
    }

    const deliveryData = { ...this.selectedDelivery, ...this.deliveryForm.value };

    if (deliveryData.id) {
      // Update existing delivery
      this.deliveryService.updateDelivery(deliveryData).subscribe({
        next: (updated) => {
          console.log('Delivery updated', updated);
          this.formOpen = false;
          this.loadDeliveries();
        },
        error: (err) => console.error('Error updating delivery', err)
      });
    } else {
      // Create new delivery
      this.deliveryService.createDelivery(deliveryData).subscribe({
        next: (saved) => {
          console.log('Delivery saved', saved);
          this.formOpen = false;
          this.loadDeliveries();
        },
        error: (err) => console.error('Error saving delivery', err)
      });
    }
  }

  loadMillingMachines(): void {
    this.millingMachineService.getAllMillMachines().subscribe((machines) => {
      this.millingMachines = machines;
    });
  }

  loadDeliveries(): void {
    this.deliveryService.getAllDeliveriesList().subscribe(
      (res) => {
        if (res && res.success) {
          this.deliveries = res.data;
          this.FilterSource.data = this.deliveries;
          this.message = res.message;
        } else {
          this.deliveries = [];
          this.message = res.message;
        }
      },
      (err) => console.error('Error loading deliveries', err)
    );
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(
      (res) => {
        if (res && res.success) {
          this.suppliers = res.data.map((supplier: SupplierType) => {
            if (supplier.genericSupplierType) {
              return {
                ...supplier,
                suppliertype: {
                  ...supplier.genericSupplierType,
                  type: TypeCategory.SUPPLIER_TYPE
                }
              };
            }
            return supplier;
          });
        }
      },
      (err) => console.error('Error loading suppliers', err)
    );
  }

  loadRegions(): void {
    this.genericTypeService.getAllTypes(TypeCategory.REGION).subscribe(
      (res) => {
        if (res && res.success) {
          this.regions = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
        }
      },
      (err) => console.error('Error loading regions', err)
    );
  }

  loadOIL_VARIETY(): void {
    this.genericTypeService.getAllTypes(TypeCategory.OIL_VARIETY).subscribe(
      (res) => {
        if (res && res.success) {
          this.varieties = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
        }
      },
      (err) => console.error('Error loading oil varieties', err)
    );
  }

  loadOLIVEVARIETY(): void {
    this.genericTypeService.getAllTypes(TypeCategory.OLIVE_VARIETY).subscribe(
      (res) => {
        if (res && res.success) {
          this.oliveVarieties = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
        }
      },
      (err) => console.error('Error loading olive varieties', err)
    );
  }

  loadProductionMethod(): void {
    this.genericTypeService.getAllTypes(TypeCategory.PRODUCTION_METHOD).subscribe(
      (res) => {
        if (res && res.success) {
          this.oilTypes = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
        }
      },
      (err) => console.error('Error loading production methods', err)
    );
  }

  loadStorageUnits(): void {
    this.storageUnitsService.getAllStorageUnit().subscribe(
      (units) => {
        this.storageUnits = units.data;
      },
      (err) => console.error('Error loading storage units', err)
    );
  }

  deleteDelivery(delivery: Delivery): void {
    if (!delivery.id) return;
    this.deliveryService.deleteDelivery(delivery.id).subscribe(
      (res) => {
        if (res && res.success) {
          this.loadDeliveries();
          this.message = res.message;
        }
      },
      (err) => console.error('Error deleting delivery', err)
    );
  }

  cancelAdd(): void {
    this.formOpen = false;
    this.selectedDelivery = this.getEmptyDelivery();
  }

  private loadTransporters() {
    this.transporterService.getAllTransporters().subscribe(
      (units) => {
        this.transporters = units.data;
      },
      (err) => console.error('Error loading storage units', err)
    );
  }


  private loadOLIVE_TYPE() {
    this.genericTypeService.getAllTypes(TypeCategory.OLIVE_TYPE).subscribe(
      (res) => {
        if (res && res.success) {
          this.oliveTypes = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
        }
      },
      (err) => console.error('Error loading regions', err)
    );
  }

  onSelectOliveType(value: OliveLotStatus) {
    this.selectedDelivery.olivType = { id: value } as BaseType;

  }
}
