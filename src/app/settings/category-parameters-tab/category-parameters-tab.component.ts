import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardComponent } from '../../theme/components/card/card.component';
import { ParameterComponent } from '../parameter/parameter.component';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { normalizeMetricValue } from '../../shared/services/DailyMetricPayload';

@Component({
  selector: 'app-category-parameters-tab',
  standalone: true,
  templateUrl: './category-parameters-tab.component.html',
  styleUrl: './category-parameters-tab.component.scss',
  imports: [CommonModule, TranslateModule, MatProgressSpinnerModule, CardComponent, ParameterComponent]
})
export class CategoryParametersTabComponent implements OnInit {
  @Input() categoryFilter?: string;
  @Input() excludeCategories: string[] = [];
  @Input() coverIcon = 'ti-settings';
  @Input() titleKey = 'GENERAL_CONFIG_UI.CATEGORY_CONFIG.TITLE';
  @Input() subtitleKey = 'GENERAL_CONFIG_UI.CATEGORY_CONFIG.SUBTITLE';
  /** Optional parameter code shown as the cover headline (e.g. PRIX_TRITURATION_KG). */
  @Input() highlightCode?: string;
  @Input() highlightSuffixKey = 'GENERAL_CONFIG_UI.FINANCE_CONFIG.PRICE_SUFFIX';

  loading = false;
  highlightDisplay: string | null = null;

  constructor(private parameterService: AppParameterService) {}

  ngOnInit(): void {
    if (!this.highlightCode) {
      return;
    }

    this.loading = true;
    this.parameterService.ensureParameterByCode(this.highlightCode).subscribe({
      next: (parameter) => {
        const value = normalizeMetricValue(parameter?.value);
        this.highlightDisplay = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.loading = false;
      },
      error: () => {
        this.highlightDisplay = null;
        this.loading = false;
      }
    });
  }
}
