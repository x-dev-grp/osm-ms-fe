// models/quality-control-result.model.ts
import { QualityControlRule } from './QualityControlRule';

export interface QualityControlResult {
  id?: number;
  rule: QualityControlRule;
  measuredValue: number;
  deliveryId?: number; // on ne ramène pas tout l'objet delivery ici, seulement son id (optionnel selon besoin)
}
