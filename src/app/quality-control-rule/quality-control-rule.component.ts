import { Component, OnInit } from '@angular/core';
import { QualityControlRuleService } from '../services/quality-control-rule.service';
import { QualityControlRule } from '../models/quality-control-rule';

@Component({
  selector: 'app-quality-control-rule',
  templateUrl: './quality-control-rule.component.html',
  styleUrls: ['./quality-control-rule.component.scss']
})
export class QualityControlRuleComponent implements OnInit {
  rules: QualityControlRule[] = [];
  // Initialize with default values
  selectedRule: QualityControlRule = {
    ruleKey: '',
    isOilQc: false,
    ruleName: '',
    description: '',
    minValue: 0,
    maxValue: 0
  };
  isEditing: boolean = false;
  message: string = '';

  constructor(private qualityControlRuleService: QualityControlRuleService) {}

  ngOnInit(): void {
    this.loadRules();
  }

  // Loads rules from the back‑end
  loadRules(): void {
    this.qualityControlRuleService.getAllRules().subscribe(
      res => {
        if (res && res.success) {
          // Unwrap nested array if necessary
          this.rules = Array.isArray(res.data) && Array.isArray(res.data[0])
            ? res.data[0]
            : res.data;
          this.message = res.message;
        } else {
          this.rules = [];
          this.message = res.message;
        }
      },
      err => {
        console.error('Error loading quality control rules', err);
      }
    );
  }

  // Creates a new rule
  addRule(): void {
    this.qualityControlRuleService.createRule(this.selectedRule).subscribe(
      res => {
        if (res && res.success) {
          this.rules.push(res.data);
          this.resetForm();
          this.message = res.message;
        }
      },
      err => {
        console.error('Error creating quality control rule', err);
      }
    );
  }

  // Prepares a rule for editing
  editRule(rule: QualityControlRule): void {
    this.selectedRule = { ...rule };
    this.isEditing = true;
  }

  // Updates an existing rule
  updateRule(): void {
    if (!this.selectedRule.id) return;
    this.qualityControlRuleService.updateRule(this.selectedRule.id, this.selectedRule).subscribe(
      res => {
        if (res && res.success) {
          this.loadRules();
          this.resetForm();
          this.isEditing = false;
          this.message = res.message;
        }
      },
      err => {
        console.error('Error updating quality control rule', err);
      }
    );
  }

  // Deletes a rule
  deleteRule(rule: QualityControlRule): void {
    if (!rule.id) return;
    this.qualityControlRuleService.deleteRule(rule.id).subscribe(
      res => {
        if (res && res.success) {
          this.rules = this.rules.filter(r => r.id !== rule.id);
          this.message = res.message;
        }
      },
      err => {
        console.error('Error deleting quality control rule', err);
      }
    );
  }

  // Cancels editing mode
  cancelEdit(): void {
    this.resetForm();
    this.isEditing = false;
  }

  // Resets the form to default values
  private resetForm(): void {
    this.selectedRule = {
      ruleKey: '',
      isOilQc: false,
      ruleName: '',
      description: '',
      minValue: 0,
      maxValue: 0
    };
  }
}
