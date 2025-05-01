export interface QualityControlRule {
  id?: string;              // original backend ID
   ruleKey: string;          // used to associate user-entered value
  oilQc?: boolean;
  ruleType?: 'numeric' | 'boolean';
  booleanValue?: boolean;
  numericValue?: number;
  ruleName?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  measuredValue?: number;
}
