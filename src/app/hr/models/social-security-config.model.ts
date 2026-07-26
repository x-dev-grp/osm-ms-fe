export interface SocialSecurityConfig {
  id?: string;
  regime?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  employeeRate?: number;
  employerRate?: number;
  cssRate?: number;
  accidentContributionRate?: number;
  calculationBaseRule?: string;
  legalReference?: string;
  version?: number;
  active?: boolean;
}
