import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupplierTypeService } from '../../../shared/services/supplier.service';
import { SupplierType } from '../../../shared/models/supplier-type';


@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './supplier-add.component.html',
  styleUrls: ['./supplier-add.component.scss']
})
export class SupplierAddComponent implements OnInit, OnDestroy {
  supplierForm: FormGroup;
  isEditing = false;
  supplierId?: string;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierTypeService,
    private snackBar: MatSnackBar,
    protected router: Router,
    private route: ActivatedRoute
  ) {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      status: ['ACTIVE']
    });
  }

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.params['id'];
    if (this.supplierId) {
      this.isEditing = true;
      this.loadSupplier();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadSupplier(): void {
    if (this.supplierId) {
      this.subs.add(
        this.supplierService.getSupplier(this.supplierId).subscribe(
          (res) => {
            if (res.success && res.data) {
              this.supplierForm.patchValue(res.data);
            } else {
              this.toast('Erreur lors du chargement du fournisseur.');
              this.router.navigate(['/fournisseur']);
            }
          },
          () => {
            this.toast('Erreur lors du chargement du fournisseur.');
            this.router.navigate(['/fournisseur']);
          }
        )
      );
    }
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      const supplier: SupplierType = this.supplierForm.value;

      if (this.isEditing && this.supplierId) {
        this.subs.add(
          this.supplierService.updateSupplier(  supplier).subscribe(
            (res) => {
              if (res.success) {
                this.toast('Fournisseur modifié avec succès.');
                this.router.navigate(['/fournisseur']);
              }
            },
            () => this.toast('Erreur lors de la modification.')
          )
        );
      } else {
        this.subs.add(
          this.supplierService.addSupplier(supplier).subscribe(
            (res) => {
              if (res.success) {
                this.toast('Fournisseur créé avec succès.');
                this.router.navigate(['/fournisseur']);
              }
            },
            () => this.toast('Erreur lors de la création.')
          )
        );
      }
    }
  }

  private toast(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['']
    });
  }
}
