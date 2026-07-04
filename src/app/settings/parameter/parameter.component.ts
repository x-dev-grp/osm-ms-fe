import { Component, Input, OnInit } from '@angular/core';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { FormBuilder, Validators } from '@angular/forms';
import { Parameter } from '../../shared/models/Parameter';
import { SharedModule } from '../../shared/shared.module';
import { DecimalPipe, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { ToastService } from '../../shared/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import {
  DailyMetricPayload,
  normalizeMetricValue,
  parseDailyMetricPayload
} from '../../shared/services/DailyMetricPayload';

@Component({
  selector: 'app-parameter',
  imports: [TranslateModule, SharedModule, NgSwitchCase, NgSwitch, NgSwitchDefault, NgIf, NgFor, DecimalPipe],
  templateUrl: './parameter.component.html',
  standalone: true,
  styleUrl: './parameter.component.scss'
})
export class ParameterComponent implements OnInit {
  parameters: Parameter[] = [];
  filtered: Parameter[] = [];
  paramForm = this.fb.group({});
  selectedCategory: string | null = null;
  categories: string[] = [];
  metricPayloads = new Map<string, DailyMetricPayload>();
  private historySearchTerms = new Map<string, string>();
  @Input() categoryFilter?: string;
  @Input() codeFilter: string[] = [];
  @Input() excludeCategories: string[] = [];

  private readonly dailyMetricCodes = new Set(['DAILY_OIL_METRIC']);

  constructor(
    private service: AppParameterService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.service.getAll().subscribe((res) => {
      this.parameters = res.data;
      this.categories = [...new Set(this.parameters.map((p) => p.category))];
      this.buildForm(this.parameters);
      this.applyFilters();
      this.loadMetricPayloads();
    });
  }

  buildForm(params: Parameter[]) {
    params.forEach((param) => {
      const validators = [Validators.required];
      if (param.type === 'DOUBLE' || param.type === 'INTEGER') {
        validators.push(Validators.pattern(/^-?\d*\.?\d+$/));
      }
      const controlKey = `param_${param.code}`;
      const initialValue = this.isDailyMetricParam(param)
        ? normalizeMetricValue(parseDailyMetricPayload(param.value).current)
        : param.value;
      const control = this.fb.control(initialValue, validators);
      this.paramForm.addControl(controlKey, control);
    });
  }

  save(param: Parameter) {
    const controlKey = `param_${param.code}`;
    const rawValue = this.paramForm.get(controlKey)?.value;
    const newValue = this.isDailyMetricParam(param)
      ? JSON.stringify(this.buildDailyMetricValue(param, rawValue))
      : rawValue;

    const updatedParam: Parameter = { ...param, value: newValue };

    this.service.updateValue(updatedParam).subscribe({
      next: (res) => {
        const updated = res.data[0];

        const index = this.parameters.findIndex((p) => p.id === updated.id);
        if (index !== -1) {
          this.parameters[index] = updated;
        }

        this.applyFilters();
        const displayValue = this.isDailyMetricParam(updated)
          ? normalizeMetricValue(parseDailyMetricPayload(updated.value).current)
          : updated.value;
        this.paramForm.get(controlKey)?.setValue(displayValue);
        this.paramForm.get(controlKey)?.markAsPristine();
        this.refreshMetricPayload(updated);
        this.toast.success('AUTO.PARAMETRE_MIS_A_JOUR_AVEC_SUCCES');
      },
      error: () => {
        this.toast.error('AUTO.ERREUR_LORS_DE_LA_MISE_A_JOUR_DU_PARAMETRE');
      }
    });
  }

  getParameterType(param: Parameter): string {
    return (param.type || 'STRING').toUpperCase();
  }

  isDailyMetricParam(param: Parameter): boolean {
    return this.dailyMetricCodes.has(param.code);
  }

  getDailyMetricPayload(param: Parameter): DailyMetricPayload {
    return this.metricPayloads.get(param.code) ?? parseDailyMetricPayload(param.value);
  }

  getHistorySearch(code: string): string {
    return this.historySearchTerms.get(code) ?? '';
  }

  onHistorySearch(code: string, term: string): void {
    this.historySearchTerms.set(code, term);
  }

  getFilteredHistory(param: Parameter): [string, number][] {
    const history = [...this.getDailyMetricPayload(param).history].reverse();
    const term = this.getHistorySearch(param.code).trim().toLowerCase();
    if (!term) {
      return history;
    }
    return history.filter(([date, value]) => date.toLowerCase().includes(term) || String(value).includes(term));
  }

  isSaveDisabled(param: Parameter): boolean {
    const control = this.paramForm.get(`param_${param.code}`);
    return !control || control.invalid || control.pristine;
  }

  private buildDailyMetricValue(param: Parameter, currentValue: unknown): DailyMetricPayload {
    const existing = parseDailyMetricPayload(param.value);
    return {
      ...existing,
      current: normalizeMetricValue(currentValue)
    };
  }

  private loadMetricPayloads(): void {
    this.parameters.filter((p) => this.isDailyMetricParam(p)).forEach((p) => this.refreshMetricPayload(p));
  }

  private refreshMetricPayload(param: Parameter): void {
    if (!this.isDailyMetricParam(param)) {
      return;
    }
    this.metricPayloads.set(param.code, parseDailyMetricPayload(param.value));
  }

  private applyFilters(): void {
    let result = [...this.parameters];

    if (this.categoryFilter) {
      result = result.filter((p) => p.category === this.categoryFilter);
    } else if (this.selectedCategory) {
      result = result.filter((p) => p.category === this.selectedCategory);
    }

    if (this.excludeCategories?.length) {
      const excluded = new Set(this.excludeCategories);
      result = result.filter((p) => !excluded.has(p.category));
    }

    if (this.codeFilter?.length) {
      const allowed = new Set(this.codeFilter);
      result = result.filter((p) => allowed.has(p.code));
    }

    this.filtered = result.sort((left, right) => left.code.localeCompare(right.code));
  }
}
