export interface QualityControlRule {
  id?: string;              // original backend ID
  ruleKey: string;          // used to associate user-entered value
  oilQc?: boolean;
  ruleType?: 'NUMERIC' | 'BOOLEAN' | 'STRING' |'RAW_STRING';
  booleanValue?: boolean;
  numericValue?: number;
  ruleName?: string;
  description?: string;
  minValue?: number;
  maxValue?: number;
  measuredValue?: number;
  ruleTextValue?: string | null;
  rawStringValue?: string | null;
}
