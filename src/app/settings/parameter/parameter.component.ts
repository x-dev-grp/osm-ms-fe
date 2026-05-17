import { Component, Input, OnInit } from '@angular/core';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { FormBuilder, Validators } from '@angular/forms';
import { Parameter } from '../../shared/models/Parameter';
import { SharedModule } from '../../shared/shared.module';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-parameter',
  imports: [SharedModule, NgSwitchCase, NgSwitch, NgSwitchDefault, NgIf],
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
  displayedColumns = ['code', 'value', 'description', 'action'];
  @Input() categoryFilter!: string;
  @Input() codeFilter: string[] = [];

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
    });
  }

  buildForm(params: Parameter[]) {
    params.forEach((param) => {
      const validators = [Validators.required];
      if (param.type === 'DOUBLE' || param.type === 'INTEGER') {
        validators.push(Validators.pattern(/^-?\d*\.?\d+$/));
      }
      const controlKey = `param_${param.code}`;
      const control = this.fb.control(param.value, validators);
      this.paramForm.addControl(controlKey, control);
    });
  }

  filter() {
    this.applyFilters();
  }

  save(param: Parameter) {
    const controlKey = `param_${param.code}`;
    const newValue = this.paramForm.get(controlKey)?.value;

    const updatedParam: Parameter = { ...param, value: newValue };

    this.service.updateValue(updatedParam).subscribe({
      next: (res) => {
        const updated = res.data[0];

        const index = this.parameters.findIndex((p) => p.id === updated.id);
        if (index !== -1) {
          this.parameters[index] = updated;
        }

        this.applyFilters();
        this.paramForm.get(controlKey)?.setValue(updated.value);
        this.toast.success('Parametre mis a jour avec succes');
      },
      error: () => {
        this.toast.error('Erreur lors de la mise a jour du parametre');
      }
    });
  }

  getParameterType(param: Parameter): string {
    return (param.type || 'STRING').toUpperCase();
  }

  private applyFilters(): void {
    let result = [...this.parameters];

    if (this.categoryFilter) {
      result = result.filter((p) => p.category === this.categoryFilter);
    } else if (this.selectedCategory) {
      result = result.filter((p) => p.category === this.selectedCategory);
    }

    if (this.codeFilter?.length) {
      const allowed = new Set(this.codeFilter);
      result = result.filter((p) => allowed.has(p.code));
    }

    this.filtered = result.sort((left, right) => left.code.localeCompare(right.code));
  }
}
