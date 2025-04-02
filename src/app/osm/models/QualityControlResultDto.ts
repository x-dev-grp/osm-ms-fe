import {QualityControlRule} from "./quality-control-rule";

export interface QualityControlResultDto {
  rule: QualityControlRule;
  measuredValue: number;
}
