import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
 import { BankAccountService } from '../../service/bankAccount.service';
import { BankAccount } from '../../models/BankAccount';
import { ApiResponse } from '../../../shared/models/api-response';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSortModule } from '@angular/material/sort';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-view-bank-account',
  templateUrl: './view-bank-account.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatSortModule,
    SharedModule,
    TranslateModule
  ],
  standalone: true,
  styleUrls: ['./view-bank-account.component.scss']
})
export class ViewBankAccountComponent implements OnInit {
  bankAccount: BankAccount | null = null;
  loading = false;

  constructor(
    private bankAccountService: BankAccountService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadBankAccount();
  }

  private loadBankAccount(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('Invalid bank account ID');
      this.router.navigate(['/finance/bank']);
      return;
    }

    this.loading = true;
    this.bankAccountService.getBankAccount(id).subscribe({
      next: (response: ApiResponse<BankAccount>) => {
        if (response.success && response.data && response.data.length > 0) {
          this.bankAccount = response.data[0];
        } else {
          this.toast.error('Bank account not found');
          this.router.navigate(['/finance/banks']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bank account:', error);
        this.toast.error('Error loading bank account details');
        this.router.navigate(['/finance/banks']);
        this.loading = false;
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/finance/banks']);
  }

  onEdit(): void {
    if (this.bankAccount) {
      this.router.navigate(['/finance/banks/edit', this.bankAccount.id]);
    }
  }

  onPrint(): void {
    // Implement print functionality
    window.print();
  }
}
