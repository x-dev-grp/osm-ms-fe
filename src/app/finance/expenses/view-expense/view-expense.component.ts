import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Expense } from '../../models/expense.model';
import { ExpenseService } from '../../service/expense.service';
import { CardComponent } from '../../../@theme/components/card/card.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-view-expense',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDividerModule, CardComponent, MatProgressSpinner],
  templateUrl: './view-expense.component.html',
  styleUrls: ['./view-expense.component.scss']
})
export class ViewExpenseComponent implements OnInit {
  expense: Expense | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadExpense(id);
    }
  }

  private loadExpense(id: string): void {
    this.loading = true;
    this.expenseService.getExpense(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.expense = response.data[0];
          if (this.route.snapshot.queryParamMap.get('print') === 'true') {
            setTimeout(() => window.print(), 0);
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/finance/expenses']);
      }
    });
  }

  onPrint(): void {
    window.print();
  }

  onBack(): void {
    this.router.navigate(['/finance/expenses']);
  }

  onEdit(): void {
    if (this.expense?.id) {
      this.router.navigate(['/finance/expenses', this.expense.id, 'edit']);
    }
  }
}
