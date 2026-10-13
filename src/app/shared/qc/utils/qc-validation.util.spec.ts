import { buildQcFormControls, evaluateRule, isWithinNumericBounds } from './qc-validation.util';
import { QualityControlRule } from '../../models/quality-control-rule';

describe('QC validation utilities', () => {
  it('honors numeric epsilon at configured boundaries', () => {
    expect(isWithinNumericBounds(0.0100005, 0, 0.01)).toBeTrue();
    expect(isWithinNumericBounds(0.01001, 0, 0.01)).toBeFalse();
  });

  it('requires boolean results to match the configured value', () => {
    const rule = { ruleKey: 'clear', ruleType: 'BOOLEAN', booleanValue: true } as QualityControlRule;
    expect(evaluateRule(rule, true)).toBe('pass');
    expect(evaluateRule(rule, false)).toBe('fail');
  });

  it('keeps numeric bounds in rule evaluation without invalidating form entry', () => {
    const rule = { ruleKey: 'acidity', ruleType: 'NUMERIC', minValue: 0, maxValue: 0.8 } as QualityControlRule;
    const form = buildQcFormControls([rule]);
    form.get('acidity')?.setValue(1.2);

    expect(form.get('acidity')?.valid).toBeTrue();
    expect(evaluateRule(rule, form.get('acidity')?.value)).toBe('fail');
  });
});
