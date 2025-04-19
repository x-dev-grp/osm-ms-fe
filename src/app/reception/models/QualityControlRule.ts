export interface QualityControlRule {
  id?: number;
  ruleKey: string; // ex: 'infestation_percentage'
  ruleName: string; // ex: 'Infestation Percentage'
  description: string;
  isisOilQc: boolean;
  minValue: number;
  maxValue: number;
}
