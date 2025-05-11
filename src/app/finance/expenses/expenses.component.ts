// 4) Combined Component: expenses.component.ts
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Expense } from '../models/expense.model';
import { ExpenseService } from '../service/expense.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../demo/shared/shared.module';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { ConfigurationComponent } from '../../@theme/layouts/configuration/configuration.component';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { OsmDashboard } from '../../shared/modules/osm-dashboard/osm-dashboard';
import { EXPENSES_DASHBOARD_CONFIG } from './expenses-dashboard.config';
import { Action, DashboardConfig } from '../../shared/modules/osm-dashboard/models/dashboard-config';
import { OilCredit } from '../models/OilCredit';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
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
    MatExpansionPanelTitle,
    OsmDashboard
  ],
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  editing = false;

  // table + pagination
  dataSource = new MatTableDataSource<Expense>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dashboardConfig: DashboardConfig = EXPENSES_DASHBOARD_CONFIG;
  displayedColumns: string[] = ['invoiceRef', 'purchaseNature', 'object', 'date', 'amount', 'actions'];

  // filtering fields
  filterValues = {
    invoiceRef: '',
    purchaseNature: ''
  };

  constructor(
    private fb: FormBuilder,
    private svc: ExpenseService,
    private router: Router
  ) {
    this.form = this.fb.group({
      id: [],
      invoiceRef: [''],
      purchaseNature: ['', Validators.required],
      object: [''],
      date: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });

    // custom predicate to filter by both fields
    this.dataSource.filterPredicate = (data: Expense, filter: string): boolean => {
      const search = JSON.parse(filter);
      const invoiceText = data.invoiceRef ? data.invoiceRef.toLowerCase() : '';
      const natureText = data.purchaseNature ? data.purchaseNature.toLowerCase() : '';
      const searchInvoice = search.invoiceRef ? search.invoiceRef.toLowerCase() : '';
      const searchNature = search.purchaseNature ? search.purchaseNature.toLowerCase() : '';
      const matchesInvoice = !searchInvoice || invoiceText.includes(searchInvoice);
      const matchesNature = !searchNature || natureText.includes(searchNature);
      return matchesInvoice && matchesNature;
    };
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadExpenses(): void {
    this.svc.getAllExpensesList().subscribe(
      (res) => {
        if (res?.success) {
          this.dataSource.data = res.data;
          this.applyFilter();
        } else {
          this.dataSource.data = [];
        }
      },
      (err) => console.error('Error loading expenses', err)
    );
  }

  /** Navigue vers la page de visualisation */
  view(id: string): void {
    this.router.navigate(['/finance/expenses', id, 'view']);
  }

  /** Ouvre dans un nouvel onglet la vue + déclenche impression */
  print(id: string): void {
    const tree = this.router.createUrlTree(['/finance/expenses', id, 'view'], { queryParams: { print: true } });
    const url = window.location.origin + this.router.serializeUrl(tree);
    window.open(url, '_blank');
  }

  openForm(expense?: Expense): void {
    this.editing = !!expense;
    this.form.reset(expense ?? { amount: 0, date: '' });
  }

  cancel(): void {
    this.editing = false;
    this.form.reset({ amount: 0, date: '' });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const exp: Expense = this.form.value;
    this.svc.createExpense(exp).subscribe(() => {
      this.loadExpenses();
      this.cancel();
    });
  }

  delete(id: string): void {
    if (!confirm('Supprimer cette dépense ?')) {
      return;
    }
    this.svc.deleteExpense(id).subscribe(() => this.loadExpenses());
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  handleAction(event: { action: Action; record: Expense }): void {
    /* prefer the explicit value, fall back to the label */


    switch (event.action.label) {
      case 'VIEW':
      case 'CONSULTER':
        this.openForm(event.record) ;
        break;

      case 'PRINT':
        this.print(event.record.id!);
        break;

      case 'EDIT':
      case 'MODIFIER':
        this.router.navigate(['/expenses', event.record.id!, 'edit']);
        break;

      case 'DELETE':
      case 'SUPPRIMER':
        this.delete(event.record.id!);
        break;

    }
  }
}
