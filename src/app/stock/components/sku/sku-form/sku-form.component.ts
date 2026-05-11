import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { SKUService } from '../../../services/sku.service';
import { ProductType, ProductUnitOfMeasure, SKU, productTypeLabel } from '../../../models/sku.model';

@Component({
  selector: 'app-sku-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sku-form.component.html',
  styleUrls: ['./sku-form.component.scss']
})
export class SkuFormComponent implements OnInit {
  skuForm: FormGroup;
  isEditMode = false;
  skuId?: string;
  submitted = false;
  submitting = false;
  error: string | null = null;
  readonly productTypes: ProductType[] = ['VRAC', 'NON_VRAC'];
  readonly unitOptions: ProductUnitOfMeasure[] = ['L', 'KG', 'BOTTLE', 'CARTON'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private skuService: SKUService
  ) {
    this.skuForm = this.fb.group({
      name: ['', [Validators.required]],
      code: [''],
      type: ['NON_VRAC' as ProductType, [Validators.required]],
      category: [''],
      unitOfMeasure: ['BOTTLE'],
      description: [''],
      grade: [''],
      origin: [''],
      harvestCampaign: [''],
      volume: [null],
      packagingType: [''],
      barcode: [''],
      unitsPerCarton: [null, [Validators.min(1)]],
      cartonsPerPallet: [null, [Validators.min(1)]],
      netWeight: [null, [Validators.min(0)]],
      grossWeight: [null, [Validators.min(0)]],
      brand: [''],
      density: [null, [Validators.min(0)]],
      storageUnit: ['']
    });
  }

  ngOnInit(): void {
    this.skuId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.skuId;
    this.updateTypeFields(this.skuForm.get('type')?.value || 'NON_VRAC');
    this.skuForm.get('type')?.valueChanges.subscribe((type: ProductType) => {
      this.updateTypeFields(type, true);
    });

    if (this.isEditMode) {
      this.loadSku();
    }
  }

  loadSku(): void {
    this.skuService.getProductById(this.skuId!).subscribe({
      next: (sku) => {
        this.skuForm.patchValue({
          name: sku.name || sku.code,
          code: sku.code || '',
          type: sku.type || 'NON_VRAC',
          category: sku.category || '',
          unitOfMeasure: sku.unitOfMeasure || (sku.type === 'VRAC' ? 'L' : 'BOTTLE'),
          description: sku.description || '',
          grade: sku.grade || '',
          origin: sku.origin || '',
          harvestCampaign: sku.harvestCampaign || '',
          volume: sku.volume || null,
          packagingType: sku.packagingType || '',
          barcode: sku.barcode || '',
          unitsPerCarton: sku.unitsPerCarton ?? sku.unitesParCols ?? null,
          cartonsPerPallet: sku.cartonsPerPallet ?? sku.colisParPalette ?? null,
          netWeight: sku.netWeight || null,
          grossWeight: sku.grossWeight || null,
          brand: sku.brand || '',
          density: sku.density || null,
          storageUnit: sku.storageUnit || ''
        });
        this.updateTypeFields(sku.type || 'NON_VRAC');
      },
      error: (err) => {
        console.error('Erreur chargement produit', err);
        this.error = 'Impossible de charger le produit';
        setTimeout(() => this.router.navigate(['/stock/products']), 2000);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = null;

    if (this.skuForm.invalid) {
      return;
    }

    this.submitting = true;
    const sku: SKU = this.skuForm.value;

    if (this.isEditMode) {
      this.skuService.updateProduct(this.skuId!, sku).subscribe({
        next: () => {
          this.router.navigate(['/stock/products', this.skuId]);
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          this.submitting = false;
        }
      });
    } else {
      this.skuService.createProduct(sku).subscribe({
        next: (created) => {
          this.router.navigate(['/stock/products', created.id]);
        },
        error: (err) => {
          console.error('Erreur création', err);
          this.error = err.error?.message || 'Erreur lors de la création';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/stock/products', this.skuId]);
    } else {
      this.router.navigate(['/stock/products']);
    }
  }

  get f() {
    return this.skuForm.controls;
  }

  isVrac(): boolean {
    return this.skuForm.get('type')?.value === 'VRAC';
  }

  isNonVrac(): boolean {
    return !this.isVrac();
  }

  formatProductType(type?: ProductType): string {
    return productTypeLabel(type);
  }

  private updateTypeFields(type: ProductType, clearMismatch = false): void {
    const volumeControl = this.skuForm.get('volume');
    const unitControl = this.skuForm.get('unitOfMeasure');

    if (type === 'VRAC') {
      unitControl?.setValue(!unitControl?.value || unitControl.value === 'BOTTLE' || unitControl.value === 'CARTON' ? 'L' : unitControl.value, { emitEvent: false });
      volumeControl?.clearValidators();
      if (clearMismatch) {
        ['volume', 'packagingType', 'barcode', 'unitsPerCarton', 'cartonsPerPallet', 'netWeight', 'grossWeight', 'brand']
          .forEach((controlName) => this.skuForm.get(controlName)?.reset(controlName === 'volume' ? null : '', { emitEvent: false }));
      }
    } else {
      unitControl?.setValue(unitControl.value === 'L' || !unitControl.value ? 'BOTTLE' : unitControl.value, { emitEvent: false });
      volumeControl?.setValidators([Validators.required, Validators.min(0.001)]);
      if (clearMismatch) {
        ['density', 'storageUnit']
          .forEach((controlName) => this.skuForm.get(controlName)?.reset(controlName === 'density' ? null : '', { emitEvent: false }));
      }
    }

    volumeControl?.updateValueAndValidity({ emitEvent: false });
  }
}
