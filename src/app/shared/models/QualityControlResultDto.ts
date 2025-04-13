import {QualityControlRule} from "./quality-control-rule";

export interface QualityControlResultDto {
  ruleId: QualityControlRule;
  measuredValue: number;
}
