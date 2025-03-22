import { Component, OnInit } from '@angular/core';
import { DeliveryService } from '../services/delivery.service';
import { SupplierService } from '../services/supplier.service';
import { GenericTypeService } from '../services/generic-type.service';
import { QualityControlRuleService } from '../services/quality-control-rule.service';

import { Delivery } from '../models/Delivery';
import { QualityControlRule } from '../models/quality-control-rule';
import { Supplier } from '../models/supplier';
import { Region } from '../models/generic/region';
import { QualityControlResultDto } from '../models/QualityControlResultDto';
import { OliveVarietyTypeDto } from '../models/generic/OliveVarietyTypeDto';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss']
})
export class DeliveryComponent implements OnInit {
  deliveries: Delivery[] = [];
  selectedDelivery: Delivery = {
    receiptNumber: '',
    lotNumber: '',
    deliveryDate: '',
    status: '',
    globalLotNumber: '',
    oliveQuantity: 0,
    oilQuantity: 0,
    region: null,
    oliveVariety: null,
    storageUnit: '',
    supplier: null,
    unitPrice: 0,
    price: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    qualityControlResults: []
  };
  isEditing: boolean = false;
  message: string = '';
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;

  suppliers: Supplier[] = [];
  regions: Region[] = [];
  varieties: OliveVarietyTypeDto[] = [];

  applyQualityControl: boolean = false;
  qualityControlRules: QualityControlRule[] = [];
  protected readonly Object = Object;

  constructor(
    private deliveryService: DeliveryService,
    private supplierService: SupplierService,
    private genericTypeService: GenericTypeService,
    private qualityControlRuleService: QualityControlRuleService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadSuppliers();
    this.loadRegions();
    this.loadVarieties();
  }

  loadDeliveries(): void {
    this.deliveryService.getAllDeliveries(this.currentPage, this.pageSize).subscribe(
      res => {
        if (res && res.success) {
          this.deliveries = res.data.content;
          this.totalPages = res.data.totalPages;
          this.message = res.message;
        } else {
          this.deliveries = [];
          this.message = res.message;
        }
      },
      err => console.error('Error loading deliveries', err)
    );
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe(
      res => {
        if (res && res.success) {
          // Fix the suppliertype objects so they always have "type: 'suppliertype'"
          this.suppliers = res.data.map((supplier: Supplier) => {
            if (supplier.suppliertype) {
              return {
                ...supplier,
                suppliertype: {
                  ...supplier.suppliertype,
                  type: 'suppliertype'
                }
              };
            }
            return supplier;
          });
        }
      },
      err => console.error('Error loading suppliers', err)
    );
  }

  loadRegions(): void {
    this.genericTypeService.getAllTypes('region').subscribe(
      res => {
        if (res && res.success) {
          this.regions = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
          console.log('Regions loaded:', this.regions);
        }
      },
      err => console.error('Error loading regions', err)
    );
  }

  loadVarieties(): void {
    this.genericTypeService.getAllTypes('oliveVariety').subscribe(
      res => {
        if (res && res.success) {
          this.varieties = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
          console.log('Varieties loaded:', this.varieties);
        }
      },
      err => console.error('Error loading varieties', err)
    );
  }

  toggleQualityControl(): void {
    if (this.applyQualityControl) {
      this.loadQualityControlRules();
    } else {
      this.qualityControlRules.forEach(rule => (rule.measuredValue = undefined));
    }
  }

  compareById(item1: any, item2: any): boolean {
    return item1 && item2 ? item1.id === item2.id : item1 === item2;
  }

  addDelivery(): void {
    const payload: Delivery = {
      ...this.selectedDelivery,
      // Prepare the qualityControlResult
      qualityControlResults: this.applyQualityControl
        ? Object.values(
          this.qualityControlRules.reduce((result, rule) => {
            if (rule.measuredValue !== undefined && rule.measuredValue !== null) {
              result[rule.id!] = { ruleId: rule.id!, measuredValue: rule.measuredValue! };
            }
            return result;
          }, {} as { [key: number]: QualityControlResultDto })
        )
        : []
    };

    // Force the 'type' fields for region, variety, supplier
    if (payload.region) {
      payload.region = { ...payload.region, type: 'region' };
    }
    if (payload.oliveVariety) {
      payload.oliveVariety = { ...payload.oliveVariety, type: 'oliveVariety' };
    }
    if (payload.supplier?.suppliertype) {
      payload.supplier.suppliertype = {
        ...payload.supplier.suppliertype,
        type: 'suppliertype'
      };
    }

    // Double check in the console
    console.log('Creating Delivery PAYLOAD:', payload);

    this.deliveryService.createDelivery(payload).subscribe(
      res => {
        if (res && res.success) {
          this.loadDeliveries();
          this.resetForm();
          this.message = res.message;
        }
      },
      err => console.error('Error creating delivery', err)
    );
  }

  loadQualityControlRules(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qualityControlRuleService.getAllRules().subscribe(
        res => {
          if (res && res.success) {
            this.qualityControlRules = res.data.map(rule => ({
              ...rule,
              measuredValue: undefined
            }));
            resolve();
          } else {
            reject('Failed to load quality control rules');
          }
        },
        err => {
          console.error('Error loading quality control rules', err);
          reject(err);
        }
      );
    });
  }

  editDelivery(delivery: Delivery): void {
    this.selectedDelivery = { ...delivery };
    this.isEditing = true;

    // Optional: If you want to keep the local selectedDelivery consistent
    if (delivery.region) {
      this.selectedDelivery.region = { ...delivery.region, type: 'region' };
    }
    if (delivery.oliveVariety) {
      this.selectedDelivery.oliveVariety = { ...delivery.oliveVariety, type: 'oliveVariety' };
    }
    if (delivery.supplier?.suppliertype) {
      this.selectedDelivery.supplier = {
        ...delivery.supplier,
        suppliertype: {
          ...delivery.supplier.suppliertype,
          type: 'suppliertype'
        }
      };
    }

    // Quality control logic
    if (delivery.qualityControlResults && Object.keys(delivery.qualityControlResults).length > 0) {
      this.applyQualityControl = true;
      this.loadQualityControlRules().then(() => {
        Object.keys(delivery.qualityControlResults).forEach(ruleKey => {
          const qc = delivery.qualityControlResults[ruleKey as unknown as number];
          const rule = this.qualityControlRules.find(r => r.id === qc.ruleId);
          if (rule) {
            rule.measuredValue = qc.measuredValue;
          }
        });
      });
    } else {
      this.applyQualityControl = false;
      this.qualityControlRules.forEach(rule => (rule.measuredValue = undefined));
    }
  }

  updateDelivery(): void {
    if (!this.selectedDelivery.id) return;

    const payload: Delivery = {
      ...this.selectedDelivery,
      qualityControlResults: this.applyQualityControl
        ? Object.values(
          this.qualityControlRules.reduce((result, rule) => {
            if (rule.measuredValue !== undefined && rule.measuredValue !== null) {
              result[rule.id!] = { ruleId: rule.id!, measuredValue: rule.measuredValue! };
            }
            return result;
          }, {} as { [key: number]: QualityControlResultDto })
        )
        : []
    };

    // Ensure the 'type' fields
    if (payload.region) {
      payload.region = { ...payload.region, type: 'region' };
    }
    if (payload.oliveVariety) {
      payload.oliveVariety = { ...payload.oliveVariety, type: 'oliveVariety' };
    }
    if (payload.supplier?.suppliertype) {
      payload.supplier.suppliertype = {
        ...payload.supplier.suppliertype,
        type: 'suppliertype'
      };
    }

    // Double check in the console
    console.log('Updating Delivery PAYLOAD:', payload);

    this.deliveryService.updateDelivery(payload.id!, payload).subscribe(
      res => {
        if (res && res.success) {
          this.loadDeliveries();
          this.resetForm();
          this.isEditing = false;
          this.message = res.message;
        }
      },
      err => console.error('Error updating delivery', err)
    );
  }

  deleteDelivery(delivery: Delivery): void {
    if (!delivery.id) return;
    this.deliveryService.deleteDelivery(delivery.id).subscribe(
      res => {
        if (res && res.success) {
          this.loadDeliveries();
          this.message = res.message;
        }
      },
      err => console.error('Error deleting delivery', err)
    );
  }

  cancelEdit(): void {
    this.resetForm();
    this.isEditing = false;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDeliveries();
    }
  }

  private resetForm(): void {
    this.selectedDelivery = {
      receiptNumber: '',
      lotNumber: '',
      deliveryDate: '',
      status: '',
      globalLotNumber: '',
      oliveQuantity: 0,
      oilQuantity: 0,
      region: null,
      oliveVariety: null,
      storageUnit: '',
      supplier: null,
      unitPrice: 0,
      price: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      qualityControlResults: []
    };
    this.applyQualityControl = false;
    this.qualityControlRules.forEach(rule => (rule.measuredValue = undefined));
  }
}
