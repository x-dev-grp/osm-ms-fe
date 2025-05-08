import { QualityControlRule } from './quality-control-rule';
import { UnifiedDelivery } from './UnifiedDelivery';

export interface QualityControlResultDto {
  id?: string;
  rule: QualityControlRule;
  measuredValue: string;
  delivery: UnifiedDelivery;
}
