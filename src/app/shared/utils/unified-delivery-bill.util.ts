import { UnifiedDelivery } from '../models/UnifiedDelivery';

export type DeliveryBillUnit = 'kg' | 'L';

export interface UnifiedDeliveryBillLine {
  quantity: number;
  unit: DeliveryBillUnit;
  unitPrice: number;
  totalHt: number;
  isOil: boolean;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Olive/net weight in kg, or oil quantity in litres — same rules as reception invoices. */
export function resolveUnifiedDeliveryBillLine(delivery: UnifiedDelivery): UnifiedDeliveryBillLine {
  const isOil = (delivery.deliveryType || '').toLowerCase() === 'oil';
  const totalHt = num(delivery.price);

  let quantity = 0;
  if (isOil) {
    quantity = num(delivery.oilQuantity) || num(delivery.poidsNet);
  } else {
    quantity = num(delivery.poidsNet) || num(delivery.oliveQuantity);
  }

  let unitPrice = num(delivery.unitPrice);
  if (unitPrice <= 0 && totalHt > 0 && quantity > 0) {
    unitPrice = totalHt / quantity;
  }
  if (quantity <= 0 && unitPrice > 0 && totalHt > 0) {
    quantity = totalHt / unitPrice;
  }

  const unit: DeliveryBillUnit = isOil ? 'L' : 'kg';
  const total = totalHt > 0 ? totalHt : unitPrice * quantity;

  return { quantity, unit, unitPrice, totalHt: total, isOil };
}

export function formatBillUnitPriceLabel(currency: string, unit: DeliveryBillUnit): string {
  return `${currency}/${unit}`;
}
