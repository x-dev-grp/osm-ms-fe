import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SharedModule } from '../../demo/shared/shared.module';
import { OilCredit, CreditState, UnitType } from '../models/OilCredit';
import { OilCreditService } from '../service/oil-credit.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OIL_CREDIT_DASHBOARD } from './oil-credit-dashboard.config';
import { ToastService } from '../../shared/services/toast.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-oil-credit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatExpansionModule,
    MatSnackBarModule,
    SharedModule,
    OsmDashboard
  ],
  templateUrl: './oil-credit.component.html',
  styleUrls: ['./oil-credit.component.scss']
})
export class OilCreditComponent implements OnInit {
  form: FormGroup;
  editing = false;
  isLoading = true;
  submitted = false;

  OIL_CREDIT_DASHBOARD: DashboardConfig = OIL_CREDIT_DASHBOARD;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private svc = inject(OilCreditService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private data: OilCredit[] = [];
  private route = inject(ActivatedRoute);

  constructor() {
    this.form = this.fb.group({
      id: [null],
      emballage: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      unit: [UnitType.L, Validators.required],
      oil_type: ['', Validators.required],
      destinataire: ['', Validators.required],
      transaction_id_in: [null],
      transaction_id_out: [null],
      creditState: [CreditState.PENDING, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCredits();
  }


  cancel(): void {
    this.editing = false;
    this.submitted = false;
    this.form.reset({
      unit: UnitType.L,
      creditState: CreditState.PENDING
    });
  }

  openForm(o?: OilCredit): void {
    this.editing = !!o;
    if (o) {
      this.form.patchValue(o);
    } else {
      this.form.reset({
        unit: UnitType.L,
        creditState: CreditState.PENDING
      });
    }
  }

  view(id: string): void {
    this.router.navigate(['/finance/oil-credit', id, 'view']);
  }

  delete(id: string): void {
    this.confirmDelete(id);
  }

  /**
   * Handles various actions on an OilCredit row.
   *
   * @param {Object} event - The event object containing the action and the row data.
   * @param {string} event.action - The action to be performed ('READ', 'UPDATE', 'DELETE').
   * @param {OilCredit} event.row - The OilCredit object associated with the action.
   *
   * //t - This function is triggered when an action is performed on an OilCredit row.
   * //r - The function extracts the action and row from the event object.
   * //n - It then performs the corresponding action based on the extracted action type.
   * 
   * @returns {void}
   */
  handleAction(event: { action: string; row: OilCredit }): void {
    const { action, row } = event;
    const id = row.id;

    switch (action) {
      case 'READ':
        this.view(id!);
        break;
      case 'UPDATE':
        this.openForm(row);
        break;
      case 'DELETE':
        this.confirmDelete(id);
        break;
    }
  }

  private confirmDelete(id?: string): void {
    const confirmMsg = this.translate.instant('OIL_CREDIT.CONFIRM_DELETE');
    if (confirm(confirmMsg)) {
      this.svc.deleteOilCredit(id!).subscribe({
        next: () => {
          this.toastService.success('OIL_CREDIT.MESSAGES.DELETE_SUCCESS');
          this.loadCredits();
        },
        error: (error) => {
          console.error('Error deleting oil credit:', error);
          this.toastService.error('OIL_CREDIT.MESSAGES.DELETE_ERROR');
        }
      });
    }
  }

  private loadCredits(): void {
    this.isLoading = true;
    this.svc.getAllOilCreditList().subscribe({
      next: (response) => {
        this.data = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading oil credits:', error);
        this.toastService.error('OIL_CREDIT.MESSAGES.LOAD_ERROR');
        this.isLoading = false;
      }
    });
  }

  // Helper methods for display
  getCreditStateLabel(state: CreditState): string {
    const key = `OIL_CREDIT.STATES.${state}`;
    return this.translate.instant(key);
  }

  getUnitLabel(unit: UnitType): string {
    const key = unit === UnitType.L ? 'OIL_CREDIT.UNITS.LITER' : 'OIL_CREDIT.UNITS.KILOGRAM';
    return this.translate.instant(key);
  }
}

