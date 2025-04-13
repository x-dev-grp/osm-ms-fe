import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SharedModule } from '../../demo/shared/shared.module';
import { CommonModule } from '@angular/common';
import { QualityControlRule } from '../../shared/models/quality-control-rule';
import { QualityControlRuleService } from '../../shared/services/quality-control-rule.service';


@Component({
  selector: 'app-quality-control-rule',
  imports: [CommonModule, SharedModule],

  templateUrl: './quality-control-rule.component.html',
  standalone: true,
  styleUrls: ['./quality-control-rule.component.scss']
})
export class QualityControlRuleComponent implements OnInit {
  message: string = '';
  rules: QualityControlRule[] = [];
  displayedColumns: string[] = ['ruleKey', 'isOilQc', 'ruleName', 'description', 'minValue', 'maxValue', 'actions'];
  selectedRule: QualityControlRule = this.createEmptyRule();
  isEditing: boolean = false;
  formOpen: boolean = false;
   FilterSource: MatTableDataSource<QualityControlRule> = new MatTableDataSource(this.rules);

  constructor(private qualityControlRuleService: QualityControlRuleService) {}

  ngOnInit(): void {
    // Initialize with sample data
    this.loadRules();
  }

  createEmptyRule(): QualityControlRule {
    return {
      id: '',
      ruleKey: '',
      oilQc: false,
      ruleName: '',
      description: '',
      minValue: 0,
      maxValue: 0
    };
  }

  loadRules(): void {
    this.qualityControlRuleService.getAllRules().subscribe(
      (res) => {
        if (res && res.success) {
          // Unwrap nested array if necessary
          this.rules = Array.isArray(res.data) && Array.isArray(res.data[0]) ? res.data[0] : res.data;
          this.FilterSource.data = this.rules;

          this.message = res.message;
        } else {
          this.rules = [];
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error loading quality control rules', err);
      }
    );
  }

  addRule(): void {
     this.qualityControlRuleService.createRule(this.selectedRule).subscribe(
      (res) => {
        if (res && res.success) {
          this.loadRules();
          this.resetForm();
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error creating quality control rule', err);
      }
    );
     this.selectedRule = this.createEmptyRule();
  }

  editRule(rule: QualityControlRule): void {
    this.selectedRule = { ...rule };
    this.isEditing = true;
    this.message = '';
  }

  updateRule(): void {
    if (!this.selectedRule.id) return;
    this.qualityControlRuleService.updateRule(  this.selectedRule).subscribe(
      (res) => {
        if (res && res.success) {
          this.loadRules();
          this.resetForm();
          this.isEditing = false;
          this.message = res.message;
          this.isEditing = false;
          this.selectedRule = this.createEmptyRule();}
      },
      (err) => {
        console.error('Error updating quality control rule', err);
      }
    );


  }

  deleteRule(rule: QualityControlRule): void {
    if (!rule.id) return;
    this.qualityControlRuleService.deleteRule(rule.id).subscribe(
      (res) => {
        if (res && res.success) {
          this.rules = this.rules.filter((r) => r.id !== rule.id);
          this.message = res.message;
        }
      },
      (err) => {
        console.error('Error deleting quality control rule', err);
      }
    );

  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedRule = this.createEmptyRule();
    this.message = 'Edit cancelled.';
    this.closeForm();
  }

  onSubmit(): void {
    if (this.isEditing) {
      this.updateRule();
    } else {
      this.addRule();
    }
    this.closeForm();
  }

  openForm(): void {
    this.cancelEdit();
    this.formOpen = true;
  }

  openFormForEdit(rule: QualityControlRule): void {
    this.editRule(rule);
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  private resetForm(): void {
    this.selectedRule = {
       ruleKey: '',
      oilQc: false,
      ruleName: '',
      description: '',
      minValue: 0,
      maxValue: 0
    };
  }
}
