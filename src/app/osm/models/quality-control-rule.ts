export interface QualityControlRule {
  id?: number;
  ruleKey?: string;
  oilQc?: boolean;
  ruleName?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  measuredValue? :number;
}
