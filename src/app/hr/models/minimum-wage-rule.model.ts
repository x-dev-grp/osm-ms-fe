export interface MinimumWageRule {
  id?: string;
  profile?: string;
  sector?: string;
  weeklyRegime?: string;
  monthlyMinimum?: number;
  hourlyMinimum?: number;
  dailyMinimum?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  legalReference?: string;
  active?: boolean;
}
