import {Component, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatIconModule} from "@angular/material/icon";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from "@angular/material/expansion";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatSortModule} from "@angular/material/sort";
import {SharedModule} from "../../../demo/shared/shared.module";
import {ConfigurationComponent} from "../../../@theme/layouts/configuration/configuration.component";
import {Delivery, OliveLotStatus} from "../../../osm/models/delivery";
import {StorageUnitDto} from "../../../osm/models/StorageUnitDto";
import {BaseType} from "../../../osm/models/base-type";
import {Supplier} from "../../../osm/models/supplier";
import {QualityControlRule} from "../../../osm/models/quality-control-rule";
import {DeliveryService} from "../../../osm/services/delivery.service";
import {StorageUnitDtoService} from "../../../osm/services/storage.service";
import {SupplierService} from "../../../osm/services/supplier.service";
import {GenericTypeService} from "../../../osm/services/generic-type.service";
import {QualityControlRuleService} from "../../../osm/services/quality-control-rule.service";
import {MillMachineService} from "../../../osm/services/mill-machine.service";
import {MillMachine} from "../../../osm/models/millMachine";
import {TypeCategory} from "../../../osm/models/type-category.enum";

@Component({
  selector: 'app-bonReception',
  standalone:true,
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
  ],  templateUrl: './reception.component.html',
  styleUrl: './reception.component.scss'
})
export class BonReceptionComponent {

  deliveries: Delivery[] = [];
  displayedColumns: string[] = ['receiptNumber', 'lotNumber', 'globalLotNumber', 'fournisseur', 'deliveryDate', 'oliveQuantity', 'status', 'actions'];
  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<never>;
  currentDelivery: Delivery | null = null;
  deliveryForm!: FormGroup;
  isEditing: boolean = false;
  message: string = '';
  storageUnits: StorageUnitDto[] = [];
  formOpen = false;
  selectedDelivery: Delivery = {} as Delivery;
  oilTypes: BaseType[] = [];
  suppliers: Supplier[] = [];
  regions: BaseType[] = [];
  oliveVarieties: BaseType[] = [];
  varieties: BaseType[] = [];
  applyQualityControl: boolean = false;
  qualityControlRules: QualityControlRule[] = [];
  FilterSource: MatTableDataSource<Delivery> = new MatTableDataSource(this.deliveries);
  protected readonly Object = Object;


  constructor(
    public dialog: MatDialog,
    private fb: FormBuilder,
    private deliveryService: DeliveryService,
    private storageUnitsService: StorageUnitDtoService,
    private supplierService: SupplierService,
    private genericTypeService: GenericTypeService,
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
      supplier: [delivery.supplier, Validators.required],
      deliveryDate: [delivery.deliveryDate, Validators.required],
      status: [delivery.status, Validators.required],
      oliveQuantity: [delivery.oliveQuantity, [Validators.required, Validators.min(1)]]
    });
  }

  getEmptyDelivery(): Delivery {
    return {
      receiptNumber: '',
      millingMachine: undefined,
      lotNumber: '',
      deliveryDate: '',
      trtDate: '',
      status: OliveLotStatus.NEW,
      globalLotNumber: '',
      tierOrBase: '',
      parcel: '',
      oliveQuantity: 0,
      oilQuantity: 0,
      region: undefined,
      oliveVariety: undefined,
      oilType: undefined,
      oilVariety: undefined,
      storageUnit: undefined,
      supplier: undefined,
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
    this.selectedDelivery.supplier = { id: supplierId } as Supplier;
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
  millingMachines: MillMachine[] = [];

  loadMillingMachines(): void {
    this.millingMachineService.getAllMillMachines().subscribe(machines => {
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
          this.suppliers = res.data.map((supplier: Supplier) => {
            if (supplier.suppliertype) {
              return {
                ...supplier,
                suppliertype: {
                  ...supplier.suppliertype,
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

}
