import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { QualityControlRule } from '../../models/quality-control-rule';
import { QualityControlResultDto } from '../../models/QualityControlResultDto';
import { QcChecklistItem, QcChecklistSummary } from '../models/qc-context.model';
import { extractOilMeasurements, suggestOilGrade } from './tunisia-qc-defaults.util';

export type QcRuleEvaluation = 'pass' | 'fail' | 'pending';

/** Tolerance for numeric QC comparisons (e.g. 0.01 max with value 0.01). */
export const QC_NUMERIC_EPSILON = 1e-6;

const FINE_PRECISION_RULE_KEYS = new Set(['DeltaK']);

export function numericStepForRule(rule: QualityControlRule): string {
  if (FINE_PRECISION_RULE_KEYS.has(rule.ruleKey)) {
    return '0.0001';
  }
  const max = rule.maxValue;
  if (max != null && max <= 0.1) {
    return '0.0001';
  }
  if (max != null && max <= 10) {
    return '0.01';
  }
  return '0.1';
}

export function isWithinNumericBounds(value: number, min?: number | null, max?: number | null): boolean {
  if (Number.isNaN(value)) {
    return false;
  }
  if (min != null && value < min - QC_NUMERIC_EPSILON) {
    return false;
  }
  if (max != null && value > max + QC_NUMERIC_EPSILON) {
    return false;
  }
  return true;
}

function numericMinValidator(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }
    const value = Number(control.value);
    if (Number.isNaN(value) || value < min - QC_NUMERIC_EPSILON) {
      return { min: { min, actual: value } };
    }
    return null;
  };
}

function numericMaxValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === '') {
      return null;
    }
    const value = Number(control.value);
    if (Number.isNaN(value) || value > max + QC_NUMERIC_EPSILON) {
      return { max: { max, actual: value } };
    }
    return null;
  };
}

export function stringOptions(rule: QualityControlRule): string[] {
  const allowed = rule.ruleTextValue || rule.rawStringValue;
  if (!allowed) {
    return [];
  }
  return allowed
    .split(',')
    .map((v) => v.trim())
    .filter((v) => !!v);
}

export function evaluateRule(rule: QualityControlRule, rawValue: string | number | boolean | null | undefined): QcRuleEvaluation {
  const isEmpty = rawValue === null || rawValue === undefined || rawValue === '';

  if (isEmpty) {
    return 'fail';
  }

  switch (rule.ruleType) {
    case 'NUMERIC': {
      const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
      if (Number.isNaN(value)) {
        return 'fail';
      }
      if (!isWithinNumericBounds(value, rule.minValue, rule.maxValue)) {
        return 'fail';
      }
      return 'pass';
    }
    case 'BOOLEAN':
      return typeof rawValue === 'boolean' ? 'pass' : 'fail';
    case 'STRING': {
      const text = String(rawValue).trim();
      const options = stringOptions(rule);
      if (options.length === 0) {
        return text ? 'pass' : 'fail';
      }
      return options.includes(text) ? 'pass' : 'fail';
    }
    default:
      return rawValue != null ? 'pass' : 'fail';
  }
}

export function buildQcFormControls(
  rules: QualityControlRule[],
  existingResults: QualityControlResultDto[] = [],
  readOnly = false
): FormGroup {
  const group: Record<string, FormControl> = {};

  rules.forEach((rule) => {
    const existing = existingResults.find((r) => r.rule?.ruleKey === rule.ruleKey);
    let initialValue: number | boolean | string | null = null;

    if (existing?.measuredValue != null) {
      switch (rule.ruleType) {
        case 'NUMERIC':
          initialValue = Number(existing.measuredValue);
          break;
        case 'BOOLEAN':
          initialValue = existing.measuredValue === 'true';
          break;
        case 'STRING':
          initialValue = existing.measuredValue;
          break;
        default:
          initialValue = existing.measuredValue;
      }
    }

    const validators = [Validators.required];
    if (rule.ruleType === 'NUMERIC') {
      if (rule.minValue != null) {
        validators.push(numericMinValidator(rule.minValue));
      }
      if (rule.maxValue != null) {
        validators.push(numericMaxValidator(rule.maxValue));
      }
    }

    group[rule.ruleKey] = new FormControl({ value: initialValue, disabled: readOnly }, validators);
  });

  return new FormGroup(group);
}

export function buildQcChecklist(
  rules: QualityControlRule[],
  values: Record<string, string | number | boolean | null | undefined>,
  isOilContext: boolean
): QcChecklistSummary {
  const items: QcChecklistItem[] = rules.map((rule) => {
    const rawValue = values[rule.ruleKey];
    const empty = rawValue === null || rawValue === undefined || rawValue === '';
    const evaluation = evaluateRule(rule, rawValue);
    return {
      ruleKey: rule.ruleKey,
      ruleName: rule.ruleName || rule.ruleKey,
      passed: evaluation === 'pending' ? null : evaluation === 'pass',
      message:
        evaluation === 'fail'
          ? empty
            ? 'Valeur requise'
            : rule.ruleType === 'STRING'
              ? 'Valeur non autorisée'
              : `Hors limites (${rule.minValue ?? '-'} – ${rule.maxValue ?? '-'})`
          : undefined
    };
  });

  const passed = items.filter((i) => i.passed === true).length;
  const failed = items.filter((i) => i.passed === false).length;
  const pending = items.filter((i) => i.passed === null).length;
  const total = items.length;
  const answered = passed + failed;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    total,
    passed,
    failed,
    pending,
    percent: answered > 0 ? Math.round((passed / answered) * 100) : percent,
    items,
    suggestedGrade: isOilContext ? suggestOilGrade(extractOilMeasurements(values)) : null
  };
}

export function buildResultPayload(
  rules: QualityControlRule[],
  form: FormGroup,
  context: {
    deliveryId?: string;
    filtrationOperationId?: string;
    traceabilityLotId?: string;
  }
): QualityControlResultDto[] {
  return rules
    .map((rule) => {
      const rawValue = form.get(rule.ruleKey)?.value;
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        return null;
      }
      return {
        rule,
        measuredValue: String(rawValue),
        deliveryId: context.deliveryId,
        filtrationOperationId: context.filtrationOperationId,
        traceabilityLotId: context.traceabilityLotId
      } as QualityControlResultDto;
    })
    .filter((item): item is QualityControlResultDto => !!item);
}

export function isQcChecklistCompliant(summary: QcChecklistSummary): boolean {
  return summary.total > 0 && summary.failed === 0 && summary.passed === summary.total;
}
