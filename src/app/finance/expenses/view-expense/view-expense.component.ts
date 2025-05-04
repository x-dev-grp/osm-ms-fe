import { Component, OnInit } from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { CommonModule }    from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatDividerModule }from '@angular/material/divider';
import { Expense } from '../../models/expense.model';
import { ExpenseService } from '../../service/expense.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-view-expense',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDividerModule, TranslatePipe],
  templateUrl: './view-expense.component.html',
  styleUrls: ['./view-expense.component.scss']
})
export class ViewExpenseComponent implements OnInit {
  expense: Expense | null = null;

  constructor(
    private route: ActivatedRoute,
    private svc: ExpenseService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getExpense(id).subscribe((res) => {
      if (res.success) {
        this.expense = res.data[0];
        // si on a ?print=true, on lance l’impression
        if (this.route.snapshot.queryParamMap.get('print') === 'true') {
          setTimeout(() => window.print(), 0);
        }
      }
    });
  }

  onPrint(): void {
    window.print();
  }

  onBack(): void {
    window.history.back();
  }
}
