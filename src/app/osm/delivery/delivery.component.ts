import { Component, input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { Delivery } from '../models/delivery';
import { SharedModule } from '../../demo/shared/shared.module';
import { DeliveryService } from '../services/delivery.service';
 import { QualityControlRule } from '../models/quality-control-rule';
import { SupplierTypeService } from '../services/supplier-type.service';
import { GenericTypeService } from '../services/generic-type.service';
import { QualityControlRuleService } from '../services/quality-control-rule.service';
import { BaseType } from '../models/base-type';
import { TypeCategory } from '../models/type-category.enum';
import { ConfigurationComponent } from '../../@theme/layouts/configuration/configuration.component';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { StorageUnitDto } from '../models/StorageUnitDto';
import { StorageUnitDtoService } from '../services/storage.service';
import { MillMachine } from '../models/millMachine';
import { MillMachineService } from '../services/mill-machine.service';
import { Transporter } from '../models/Transporter';
import { TransporterService } from '../services/TransporterService';
import { deliveryType } from '../models/deleveryType';
import { OliveLotStatus } from '../models/OliveLotStatus';
import { SupplierType } from '../models/supplier-type';

export enum DeliveryOperationType {
  OIL_PURCHASE = 'oil_purchase',
  BASE_OIL_PURCHASE = 'base_oil_purchase',
  OLIVE_PURCHASE = 'olive_purchase',
  EXCHANGE = 'exchange',
  MILLING = 'milling'
}

@Component({
  selector: 'app-delivery',
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
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss']
})
export class DeliveryComponent implements OnInit {
  deliveries: Delivery[] = [];
  displayedColumns: string[] = [
    'receiptNumber',
    'lotNumber',
    'globalLotNumber',
    'fournisseur',
    'deliveryDate',
    'oliveQuantity',
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
  selectedDelivery: Delivery = {} as Delivery;
  oilTypes: BaseType[] = [];
  suppliers: SupplierType[] = [];
  regions: BaseType[] = [];
  oliveVarieties: BaseType[] = [];
  varieties: BaseType[] = [];
  applyQualityControl: boolean = false;
  qualityControlRules: QualityControlRule[] = [];
  FilterSource: MatTableDataSource<Delivery> = new MatTableDataSource(this.deliveries);
  operationTypes = Object.values(DeliveryOperationType);
  selectedOperationType: DeliveryOperationType = DeliveryOperationType.OLIVE_PURCHASE;
  transporters: Transporter[] = []; // full list
  filteredTransporters: Transporter[] = []; // filtered list
  transporterSearch: string = '';
  millingMachines: MillMachine[] = [];
  protected readonly Object = Object;
  protected readonly input = input;

  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private storageUnitsService: StorageUnitDtoService,
    private supplierService: SupplierTypeService,
    private genericTypeService: GenericTypeService,
    private transportersService: TransporterService,
    private qualityControlRuleService: QualityControlRuleService,
    private millingMachineService: MillMachineService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadSuppliers();
    this.loadMillingMachines();
    this.loadRegions();
    this.loadOLIVEVARIETY();
    this.loadOIL_VARIETY();
    this.loadProductionMethod();
    this.loadStorageUnits();
    this.loadTransporters();
  }

  openDialog(delivery?: Delivery) {
    this.currentDelivery = delivery || this.getEmptyDelivery();
    this.initForm(this.currentDelivery);
    this.dialog.open(this.dialogTemplate, { width: '600px' });
  }

  compareTransporters = (t1: Transporter, t2: Transporter) => t1 && t2 && t1.id === t2.id;
  oliveLotStatus: OliveLotStatus;

  initForm(delivery: Delivery) {
    this.deliveryForm = this.fb.group({
      receiptNumber: [delivery.receiptNumber, Validators.required],
      lotNumber: [delivery.lotNumber, Validators.required],
      supplier: [delivery.supplierType, Validators.required],
      deliveryDate: [delivery.deliveryDate, Validators.required],
      status: [delivery.status, Validators.required],
      oliveQuantity: [delivery.oliveQuantity, [Validators.required, Validators.min(1)]]
    });
  }

  filterTransporters() {
    const search = this.transporterSearch.toLowerCase();
    this.filteredTransporters = this.transporters.filter((t) => t.licenseNumber?.toLowerCase().includes(search));
  }

  getEmptyDelivery(): Delivery {
    return {
      receiptNumber: '',
      millingMachine: undefined,
      lotNumber: '',
      deliveryDate: '',
      trtDate: '',
      status: OliveLotStatus.NEW,
      deliveryType: deliveryType.OLIVE,
      globalLotNumber: '',
      tierOrBase: '',
      parcel: '',
      oliveQuantity: 0,
      oilQuantity: 0,
      sackCount: 0,
      region: undefined,
      oliveVariety: undefined,
      oilType: undefined,
      oilVariety: undefined,
      storageUnit: undefined,
      supplierType: undefined,
      transporter: undefined,
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

  onSelectMillMachin(mill: string) {
    this.selectedDelivery.millingMachine = { id: mill } as MillMachine;
  }

  onSelectSupplier(supplierId: string) {
    this.selectedDelivery.supplierType = { id: supplierId } as SupplierType;
  }

  onSelectStorageUnit(unitId: string) {
    this.selectedDelivery.storageUnit = { id: unitId } as StorageUnitDto;
  }

  onSelectOliveVariety(varId: string) {
    this.selectedDelivery.oliveVariety = { id: varId } as BaseType;
  }

  onSubmitNewDelivery() {
    this.deliveryService.createDelivery(this.selectedDelivery).subscribe({
      next: (saved) => {
        console.log('Delivery saved', saved);
        this.formOpen = false;
        this.loadDeliveries();
      },
      error: (err) => console.error('Error saving', err)
    });
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

          const parsedLotNumbers = this.deliveries
            .map((d) => d.lotNumber?.replace(/^\D+/, '') ?? '') // remove prefix
            .map((numStr) => parseInt(numStr, 10)) // parse to number
            .filter((n) => !isNaN(n)); // keep valid numbers only

          const maxLotNumber = parsedLotNumbers.length > 0 ? Math.max(...parsedLotNumbers) : 1;

          console.log('Max Lot Number:', maxLotNumber);

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
          this.suppliers = res.data.map((supplier_type: SupplierType) => {
            if (supplier_type.genericSupplierType) {
              return {
                ...supplier_type,
                suppliertype: {
                  ...supplier_type.genericSupplierType,
                  type: TypeCategory.SUPPLIER_TYPE
                }
              };
            }
            return supplier_type;
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
      (err) => console.error('Error loading varieties', err)
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
      (err) => console.error('Error loading oil types', err)
    );
  }

  loadStorageUnits(): void {
    this.storageUnitsService.getAllStorageUnit().subscribe((units) => {
      this.storageUnits = units.data;
    });
    console.log('storageUnits', this.storageUnits);
  }

  loadQualityControlRules(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qualityControlRuleService.getAllRules().subscribe(
        (res) => {
          if (res && res.success) {
            this.qualityControlRules = res.data.map((rule) => ({
              ...rule,
              measuredValue: undefined
            }));
            resolve();
          } else {
            reject('Failed to load quality control rules');
          }
        },
        (err) => {
          console.error('Error loading quality control rules', err);
          reject(err);
        }
      );
    });
  }

  private loadTransporters() {
    this.transportersService.getAllTransporters().subscribe((transporters) => {
      this.transporters = transporters.data;
      this.filteredTransporters = transporters.data;
    });
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
  }

  onSelectOliveLotStatus(value: OliveLotStatus) {
    this.selectedDelivery.status = value   ;
  }
}
