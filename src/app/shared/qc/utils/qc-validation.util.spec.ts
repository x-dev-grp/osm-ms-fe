import { buildQcFormControls, evaluateRule, isWithinNumericBounds } from './qc-validation.util';
import { QualityControlRule } from '../../models/quality-control-rule';

describe('QC validation utilities', () => {
  it('honors numeric epsilon at configured boundaries', () => {
    expect(isWithinNumericBounds(0.0100005, 0, 0.01)).toBeTrue();
    expect(isWithinNumericBounds(0.01001, 0, 0.01)).toBeFalse();
  });

  it('passes any boolean answer', () => {
    const rule = { ruleKey: 'clear', ruleType: 'BOOLEAN', booleanValue: true } as QualityControlRule;
    expect(evaluateRule(rule, true)).toBe('pass');
    expect(evaluateRule(rule, false)).toBe('pass');
  });

  it('invalidates numeric entries outside the configured bounds', () => {
    const rule = { ruleKey: 'acidity', ruleType: 'NUMERIC', minValue: 0, maxValue: 0.8 } as QualityControlRule;
    const form = buildQcFormControls([rule]);

    form.get('acidity')?.setValue(1.2);
    expect(form.get('acidity')?.hasError('max')).toBeTrue();
    expect(form.valid).toBeFalse();
    expect(evaluateRule(rule, 1.2)).toBe('fail');

    form.get('acidity')?.setValue(-0.1);
    expect(form.get('acidity')?.hasError('min')).toBeTrue();

    form.get('acidity')?.setValue(0.8000005);
    expect(form.valid).toBeTrue();
  });
});
