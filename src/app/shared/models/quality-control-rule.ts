export interface QualityControlRule {
  id?: string;
  ruleKey: string;
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
