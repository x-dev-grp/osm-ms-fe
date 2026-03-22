import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { SKUService } from '../../../services/sku.service';
import { SKU } from '../../../models/sku.model';

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private skuService: SKUService
  ) {
    this.skuForm = this.fb.group({
      code: ['', [Validators.required]],
      category: [''],
      volume: [null, ],
      unitesParCols: [null, [Validators.min(1)]],
      colisParPalette: [null, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.skuId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.skuId;

    if (this.isEditMode) {
      this.loadSku();
    }
  }

  loadSku(): void {
    this.skuService.getSkuById(this.skuId!).subscribe({
      next: (sku) => {
        this.skuForm.patchValue({
          code: sku.code,
          category: sku.category || '',
          volume: sku.volume || null,
          unitesParCols: sku.unitesParCols || null,
          colisParPalette: sku.colisParPalette || null
        });
      },
      error: (err) => {
        console.error('Erreur chargement SKU', err);
        this.error = 'Impossible de charger le SKU';
        setTimeout(() => this.router.navigate(['/stock/skus']), 2000);
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
      this.skuService.updateSku(this.skuId!, sku).subscribe({
        next: () => {
          this.router.navigate(['/stock/skus', this.skuId]);
        },
        error: (err) => {
          console.error('Erreur mise à jour', err);
          this.error = err.error?.message || 'Erreur lors de la mise à jour';
          this.submitting = false;
        }
      });
    } else {
      this.skuService.createSku(sku).subscribe({
        next: (created) => {
          this.router.navigate(['/stock/skus', created.id]);
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
      this.router.navigate(['/stock/skus', this.skuId]);
    } else {
      this.router.navigate(['/stock/skus']);
    }
  }

  get f() {
    return this.skuForm.controls;
  }
}
