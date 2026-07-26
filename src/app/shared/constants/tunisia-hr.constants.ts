/**
 * Statutory payroll rates (CNSS, IRPP, CSS, SMIG) are configured on the backend
 * (legal rules / social-security / tax configurations). Frontend constants below
 * are provisional display fallbacks only — not the source of truth.
 */
export const TUNISIA_SMIG_MONTHLY_48H = 528.32;
export const TUNISIA_SMIG_MONTHLY_40H = 448.238;
export const TUNISIA_SMAG_DAILY = 20.32;

/** @deprecated Provisional fallback — use backend SocialSecurityConfig rates. */
export const TUNISIA_CNSS_EMPLOYEE_RATE = 0.0968;
/** @deprecated Provisional fallback — use backend SocialSecurityConfig rates. */
export const TUNISIA_CNSS_EMPLOYER_RATE = 0.1707;

export const TUNISIA_HR_CONTRACT_LEGAL_MENTION_KEY = 'HR.CONTRACT.LEGAL_MENTION';
export const TUNISIA_HR_PAYSLIP_LEGAL_MENTION_KEY = 'HR.PAYSLIP.LEGAL_MENTION';

export enum WorkRegime {
  HOURS_48 = 'HOURS_48',
  HOURS_40 = 'HOURS_40',
  AGRICULTURAL = 'AGRICULTURAL'
}
