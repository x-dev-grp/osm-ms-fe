export interface QualityControlRule {
  id?: number;
  ruleKey?: string;
  isOilQc?: boolean;
  ruleName?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  measuredValue? :number;
}
