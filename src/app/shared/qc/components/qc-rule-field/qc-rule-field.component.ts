import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { QualityControlRule } from '../../../models/quality-control-rule';
import { evaluateRule, numericStepForRule, stringOptions } from '../../utils/qc-validation.util';
import { formatQcRuleDescription } from '../../utils/tunisia-qc-defaults.util';

@Component({
  selector: 'app-qc-rule-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, TranslateModule],
  templateUrl: './qc-rule-field.component.html',
  styleUrls: ['./qc-rule-field.component.scss']
})
export class QcRuleFieldComponent {
  @Input({ required: true }) rule!: QualityControlRule;
  @Input({ required: true }) control!: FormControl;
  @Input() compact = false;

  get evaluation(): 'pass' | 'fail' | 'pending' {
    return evaluateRule(this.rule, this.control.value);
  }

  get options(): string[] {
    return stringOptions(this.rule);
  }

  ruleLabel(): string {
    return this.rule.ruleName || this.rule.ruleKey;
  }

  displayDescription(): string | null {
    return formatQcRuleDescription(this.rule.description);
  }

  numericStep(): string {
    return numericStepForRule(this.rule);
  }

  ruleTypeLabel(): string {
    return this.rule.ruleType || '';
  }

  statusLabel(): string {
    if (this.evaluation === 'pass') {
      return 'CONTROLE_QUALITE.COMPLIANCE.PASS';
    }
    if (this.evaluation === 'fail') {
      return 'CONTROLE_QUALITE.COMPLIANCE.FAIL';
    }
    return 'CONTROLE_QUALITE.COMPLIANCE.PENDING';
  }

  statusAriaLabel(): string {
    if (this.evaluation === 'pass') {
      return 'Pass';
    }
    if (this.evaluation === 'fail') {
      return 'Fail';
    }
    return 'Pending';
  }
}
