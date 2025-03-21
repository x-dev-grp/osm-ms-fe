import { Component, OnInit } from '@angular/core';
import { DeliveryService } from '../services/delivery.service';
import { SupplierService } from '../services/supplier.service';
import { GenericTypeService } from '../services/generic-type.service';
import { QualityControlRuleService } from '../services/quality-control-rule.service';

import { Delivery } from '../models/Delivery';
import { VarietyDto } from '../models/VarietyDto';
import { QualityControlRule } from '../models/quality-control-rule';
import { Supplier } from '../models/supplier';
import { Region } from '../models/region';
import { QualityControlResultDto } from '../models/QualityControlResultDto';

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
    variety: null,
    storageUnit: '',
    supplier: null,
    unitPrice: 0,
    price: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    qualityControlResult: {}
  };
  isEditing: boolean = false;
  message: string = '';
  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;

  // Dropdown lists for related entities
  suppliers: Supplier[] = [];
  regions: Region[] = [];
  varieties: VarietyDto[] = [];

  // Quality Control properties
  applyQualityControl: boolean = false;
  qualityControlRules: QualityControlRule[] = [];

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
            this.suppliers = res.data;
          }
        },
        err => console.error('Error loading suppliers', err)
    );
  }

  loadRegions(): void {
    this.genericTypeService.getAllTypes('region').subscribe(
        res => {
          if (res && res.success) {
            this.regions = Array.isArray(res.data) && Array.isArray(res.data[0])
                ? res.data[0]
                : res.data;
            console.log('Regions loaded:', this.regions);
          }
        },
        err => console.error('Error loading regions', err)
    );
  }

  loadVarieties(): void {
    this.genericTypeService.getAllTypes('variety').subscribe(
        res => {
          if (res && res.success) {
            this.varieties = Array.isArray(res.data) && Array.isArray(res.data[0])
                ? res.data[0]
                : res.data;
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
      this.qualityControlRules.forEach(rule => rule.measuredValue = undefined);
    }
  }

  compareById(item1: any, item2: any): boolean {
    return item1 && item2 ? item1.id === item2.id : item1 === item2;
  }

  loadQualityControlRules(): void {
    this.qualityControlRuleService.getAllRules().subscribe(
        res => {
          if (res && res.success) {
            this.qualityControlRules = res.data.map(rule => ({
              ...rule,
              measuredValue: undefined // Initialize measuredValue to undefined
            }));
          }
        },
        err => console.error('Error loading quality control rules', err)
    );
  }

  addDelivery(): void {
    const payload: Delivery = {
      ...this.selectedDelivery,
      qualityControlResult: this.applyQualityControl
          ? this.qualityControlRules
              .filter(rule => rule.measuredValue !== undefined && rule.measuredValue !== null)
              .reduce((result, rule) => {
                result[rule.id!] = { ruleId: rule.id!, measuredValue: rule.measuredValue! };
                return result;
              }, {} as { [key: number]: QualityControlResultDto })
          : {}
    };
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

  editDelivery(delivery: Delivery): void {
    this.selectedDelivery = { ...delivery };
    this.isEditing = true;

    // Map region to the loaded instance (if regions are loaded)
    if (this.regions && this.regions.length > 0 && delivery.region) {
      const matchedRegion = this.regions.find(r => r.id === delivery.region?.id);
      if (matchedRegion) {
        this.selectedDelivery.region = { ...matchedRegion, type: 'region' };
      }
    }

    // Map variety to the loaded instance (if varieties are loaded)
    if (this.varieties && this.varieties.length > 0 && delivery.variety) {
      const matchedVariety = this.varieties.find(v => v.id === delivery.variety?.id);
      if (matchedVariety) {
        this.selectedDelivery.variety = { ...matchedVariety, type: 'variety' };
      }
    }

    // Map supplier to the loaded instance (if suppliers are loaded)
    if (this.suppliers && this.suppliers.length > 0 && delivery.supplier) {
      const matchedSupplier = this.suppliers.find(s => s.id === delivery.supplier?.id);
      if (matchedSupplier) {
        this.selectedDelivery.supplier = matchedSupplier;
      }
    }

    // Quality control logic
    if (delivery.qualityControlResult) {
      this.applyQualityControl = true;
      this.loadQualityControlRules();
      Object.keys(delivery.qualityControlResult).forEach(ruleKey => {
        const qc = delivery.qualityControlResult[ruleKey];
        const rule = this.qualityControlRules.find(r => r.id === qc.ruleId);
        if (rule) {
          rule.measuredValue = qc.measuredValue;
        }
      });
    } else {
      this.applyQualityControl = false;
      this.qualityControlRules.forEach(rule => rule.measuredValue = undefined);
    }
  }

  updateDelivery(): void {
    if (!this.selectedDelivery.id) return;

    const payload: Delivery = {
      ...this.selectedDelivery,
      qualityControlResult: this.applyQualityControl
          ? this.qualityControlRules
              .filter(rule => rule.measuredValue !== undefined && rule.measuredValue !== null)
              .reduce((result, rule) => {
                result[rule.id!] = { ruleId: rule.id!, measuredValue: rule.measuredValue! };
                return result;
              }, {} as { [key: number]: QualityControlResultDto })
          : {}
    };

    this.deliveryService.updateDelivery(this.selectedDelivery.id, payload).subscribe(
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
      variety: null,
      storageUnit: '',
      supplier: null,
      unitPrice: 0,
      price: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      qualityControlResult: {}
    };
    this.applyQualityControl = false;
    this.qualityControlRules.forEach(rule => rule.measuredValue = undefined);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDeliveries();
    }
  }
}
