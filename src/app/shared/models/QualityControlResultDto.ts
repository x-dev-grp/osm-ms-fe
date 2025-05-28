import {QualityControlRule} from './quality-control-rule';

export interface QualityControlResultDto {
  id?: string;
  rule: QualityControlRule;
  measuredValue: string;
  deliveryId: string;
}
