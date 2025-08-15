import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { SharedModule } from '../../shared/shared.module';
import { BankAccount } from '../../finance/models/BankAccount';
import { CompanyProfileService } from '../../shared/services/company-profile.service';
import { CompanyProfile } from '../../shared/models/CompanyProfile';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TypeCategory } from '../../shared/models/type-category.enum';
import { CompanyProfileComponent } from '../company/company-profile.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ParameterComponent } from '../parameter/parameter.component';


@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatListModule,
    SharedModule,
    TranslateModule,
    CompanyProfileComponent,
    ParameterComponent
  ],
  templateUrl: './general-config.component.html',
  styleUrl: './general-config.component.scss'
})
export class GeneralConfigComponent implements OnInit {
  productionConfigForm!: FormGroup;
  financeConfigForm!: FormGroup;
  hrConfigForm!: FormGroup;
  otherConfigForm!: FormGroup;
  activeTab: string = 'company'; // default tab

  productionConfigFormEnabled = false;
  financeConfigFormEnabled = false;
  hrConfigFormEnabled = false;
  otherConfigFormEnabled = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.productionConfigForm = this.fb.group({});
    this.financeConfigForm = this.fb.group({
      millingPricePerKg: [0]
    });
    this.hrConfigForm = this.fb.group({});
    this.otherConfigForm = this.fb.group({});
    this.productionConfigForm.disable();
    this.financeConfigForm.disable();
    this.hrConfigForm.disable();
    this.otherConfigForm.disable();
  }

  onSaveProductionConfig(): void {
    if (this.productionConfigForm.invalid) return;
    // Implement save logic for production config
  }
  onSaveFinanceConfig(): void {
    if (this.financeConfigForm.invalid) return;
    // Implement save logic for finance config
  }
  onSaveHrConfig(): void {
    if (this.hrConfigForm.invalid) return;
    // Implement save logic for HR config
  }
  onSaveOtherConfig(): void {
    if (this.otherConfigForm.invalid) return;
    // Implement save logic for other config
  }

  onResetProductionConfig() {
    this.productionConfigForm.reset();
  }
  onResetFinanceConfig() {
    this.financeConfigForm.reset();
  }
  onResetHrConfig() {
    this.hrConfigForm.reset();
  }
  onResetOtherConfig() {
    this.otherConfigForm.reset();
  }

  enableProductionConfigForm() {
    this.productionConfigFormEnabled = true;
    this.productionConfigForm.enable();
  }
  enableFinanceConfigForm() {
    this.financeConfigFormEnabled = true;
    this.financeConfigForm.enable();
  }
  enableHrConfigForm() {
    this.hrConfigFormEnabled = true;
    this.hrConfigForm.enable();
  }
  enableOtherConfigForm() {
    this.otherConfigFormEnabled = true;
    this.otherConfigForm.enable();
  }

// This function is called when a tab is changed
  onTabChange(event: MatTabChangeEvent) {
    // Log the event to the console
    console.log(event);
       const tabLabel = event.tab.textLabel.toLowerCase();

      if (tabLabel.includes('production')) {
        this.activeTab = 'parameter';
      } else if (tabLabel.includes('general')) {
        this.activeTab = 'company';
      } else if (tabLabel.includes('finance')) {
        this.activeTab = 'finance';
      } else {
        this.activeTab = 'other';
      }

  }
}
