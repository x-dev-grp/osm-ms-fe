import { Component, Input, OnInit } from '@angular/core';
import { AppParameterService } from '../../shared/services/AppParameterService';
import { FormBuilder, Validators } from '@angular/forms';
import { Parameter } from '../../shared/models/Parameter';
import { SharedModule } from '../../shared/shared.module';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

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

  constructor(
    private service: AppParameterService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.service.getAll().subscribe((res) => {
      this.parameters = res.data;
      this.filtered = [...this.parameters];
      this.categories = [...new Set(this.parameters.map((p) => p.category))];
      this.buildForm(this.parameters);
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
    this.filtered = this.selectedCategory
      ? this.parameters.filter((p) => p.category === this.selectedCategory)
      : [...this.parameters];
  }

  save(param: Parameter) {
    const controlKey = `param_${param.code}`;
    const newValue = this.paramForm.get(controlKey)?.value;

    const updatedParam: Parameter = { ...param, value: newValue };

    this.service.updateValue(updatedParam).subscribe((res) => {
      const updated = res.data[0];

      // Update in-memory list
      const index = this.parameters.findIndex((p) => p.id === updated.id);
      if (index !== -1) {
        this.parameters[index] = updated;
      }

      // Refresh filtered view
      this.filter();

      // Update form control
      this.paramForm.get(controlKey)?.setValue(updated.value);
    });
  }
}
