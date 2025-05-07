export interface QualityControlRule {
  id?: string;              // original backend ID
   ruleKey: string;          // used to associate user-entered value
  oilQc?: boolean;
  ruleType?: 'NUMERIC' | 'BOOLEAN';
  booleanValue?: boolean;
  numericValue?: number;
  ruleName?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  measuredValue?: number;
}
