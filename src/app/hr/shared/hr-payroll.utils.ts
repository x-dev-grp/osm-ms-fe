/**
 * Provisional client-side preview helpers only.
 * Authoritative CNSS / IRPP / CSS amounts come from the backend payroll engine
 * (configured via social-security and tax configuration entities).
 * Payslip forms should prefer backend-calculated fields and treat these values
 * as non-authoritative UI estimates when the API has not yet returned amounts.
 */
import {
  TUNISIA_CNSS_EMPLOYEE_RATE,
  TUNISIA_CNSS_EMPLOYER_RATE
} from '../../shared/constants/tunisia-hr.constants';

/** Provisional CSS fallback (0.5%) — backend Tax/SocialSecurity config is authoritative. */
export const TUNISIA_CSS_RATE = 0.005;

export interface PayslipPreviewAmounts {
  cnssEmployee: number;
  cnssEmployer: number;
  irpp: number;
  css: number;
  netSalary: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function bracket(taxable: number, from: number, to: number, rate: number): number {
  if (taxable <= from) {
    return 0;
  }
  return (Math.min(taxable, to) - from) * rate;
}

/** @deprecated Provisional IRPP estimate — backend TaxConfiguration brackets are authoritative. */
export function calculateIrpp(taxableMonthly: number): number {
  const taxable = Math.max(0, taxableMonthly);
  let tax = 0;
  tax += bracket(taxable, 0, 1500, 0);
  tax += bracket(taxable, 1500, 5000, 0.15);
  tax += bracket(taxable, 5000, 10000, 0.25);
  tax += bracket(taxable, 10000, 20000, 0.3);
  tax += bracket(taxable, 20000, Number.MAX_VALUE, 0.35);
  return round2(tax);
}

/**
 * Non-authoritative preview for empty draft forms.
 * Do not overwrite backend-calculated payslip fields with these values when viewing/editing saved slips.
 */
export function previewPayslipAmounts(
  baseSalary: number,
  bonuses: number,
  grossOverride?: number | null
): PayslipPreviewAmounts {
  const gross = grossOverride != null && grossOverride > 0 ? grossOverride : baseSalary + bonuses;
  const cnssEmployee = round2(Math.max(0, gross) * TUNISIA_CNSS_EMPLOYEE_RATE);
  const cnssEmployer = round2(Math.max(0, gross) * TUNISIA_CNSS_EMPLOYER_RATE);
  const css = round2(Math.max(0, gross) * TUNISIA_CSS_RATE);
  const irpp = calculateIrpp(gross - cnssEmployee);
  const netSalary = round2(Math.max(0, gross) - cnssEmployee - irpp - css);
  return { cnssEmployee, cnssEmployer, irpp, css, netSalary };
}
