import { Component, OnInit } from '@angular/core';
import { DeliveryService } from '../../services/delivery.service';
import { SupplierService } from '../../services/supplier.service';
import { GenericTypeService } from '../../services/generic-type.service';
import { QualityControlRuleService } from '../../services/quality-control-rule.service';

import { Delivery } from '../../models/Delivery';
import { VarietyDto } from '../../models/VarietyDto';
import { QualityControlRule } from '../../models/quality-control-rule';
 import {T} from "@angular/cdk/keycodes";
import {BaseType} from "../../models/base-type";
import {Supplier} from "../../models/supplier";
import {Region} from "../../models/region";
import {QualityControlResultDto} from "../../models/QualityControlResultDto";
type KeyedObject<T> = { [key: string]: T };

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

  qualityControlResult: { [key: string]: QualityControlResultDto } = {};
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
          // Check if the response is a nested array and extract the inner array if needed
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
      this.qualityControlResult = {};
    }
  }

  compareById(item1: any, item2: any): boolean {
    return item1 && item2 ? item1.id === item2.id : item1 === item2;
  }

  loadQualityControlRules(): void {
    this.qualityControlRuleService.getAllRules().subscribe(
      res => {
        if (res && res.success) {
          this.qualityControlRules = res.data;
          if (this.qualityControlRules.length > 0) {
            this.qualityControlRules.forEach(rule => {
              if (rule !=undefined && !(rule.id! in this.qualityControlResult)) {
                this.qualityControlResult[rule.id!] = { ruleId: rule.id!, measuredValue: 0 };
              }
            });
          }
        }
      },
      err => console.error('Error loading quality control rules', err)
    );
  }

  addDelivery(): void {
    const payload: Delivery = {
      ...this.selectedDelivery,
      qualityControlResult: this.applyQualityControl ? this.qualityControlResult : {}
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

    if (this.regions && this.regions.length > 0 && delivery.region) {
      const matchedRegion = this.regions.find(r => r.id === delivery.region?.id);
      if (matchedRegion) {
        this.selectedDelivery.region = { ...matchedRegion, type: 'region' };
      }
    }

    if (this.varieties && this.varieties.length > 0 && delivery.variety) {
      const matchedVariety = this.varieties.find(v => v.id === delivery.variety?.id);
      if (matchedVariety) {
        this.selectedDelivery.variety = { ...matchedVariety, type: 'variety' };
      }
    }

    if (this.suppliers && this.suppliers.length > 0 && delivery.supplier) {
      const matchedSupplier = this.suppliers.find(s => s.id === delivery.supplier?.id);
      if (matchedSupplier) {
        this.selectedDelivery.supplier = matchedSupplier;
      }
    }

    if (delivery.qualityControlResult) {
      this.applyQualityControl = true;
      this.qualityControlResult = {}; // ✅ FIXED: Initialize as an empty object

      if (delivery.qualityControlResult) {
        Object.keys(delivery.qualityControlResult).forEach(ruleKey => {
          // @ts-ignore
          const qc = delivery.qualityControlResult[ruleKey]; // TypeScript now knows the type of qc
          if (qc) {
            this.qualityControlResult[ruleKey] = { ruleId: qc.ruleId, measuredValue: qc.measuredValue };
          }
        });
      }

      this.loadQualityControlRules();
    } else {
      this.applyQualityControl = false;
      this.qualityControlResult = {}; // ✅ FIXED: Ensure it's an empty object, not null
    }
  }
    stripAndSetType<T extends { id: number; name: string }>(item: BaseType, type: string): T | null {
      if (item && typeof item.id === 'number' && typeof item.name === 'string') {
        return {...item, type} as unknown as T;
      }
      return null;}



  updateDelivery(): void {
    if (!this.selectedDelivery.id) return;

    const mappedRegion = this.selectedDelivery.region
      ? this.stripAndSetType(this.selectedDelivery.region, 'region') as Region
      : null;

    const mappedVariety = this.selectedDelivery.variety
      ? this.stripAndSetType(this.selectedDelivery.variety, 'variety') as VarietyDto
      : null;

    const mappedSupplier = this.selectedDelivery.supplier;

    // Safe initialization and check
    const qualityControlResultsArray = (this.applyQualityControl && this.qualityControlResult)
      ? Object.keys(this.qualityControlResult).map(ruleKey => ({
        ruleId: Number(ruleKey),
        measuredValue: this.qualityControlResult[ruleKey]?.measuredValue
      }))
      : [];

    const payload = {
      ...this.selectedDelivery,
      region: mappedRegion,
      variety: mappedVariety,
      supplier: mappedSupplier,
      qualityControlResults: qualityControlResultsArray
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
      qualityControlResult: {} // Assign an empty object

  };
    this.applyQualityControl = false;
    this.qualityControlResult = {};  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDeliveries();
    }
  }

  protected readonly Object = Object;
}
