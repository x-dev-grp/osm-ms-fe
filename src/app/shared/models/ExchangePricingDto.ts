/**
 * DTO for exchange pricing update
 * Contains all form values for exchange delivery pricing
 */
export interface ExchangePricingDto {
  /** Delivery ID */
  deliveryId: string;

  /** Standard pricing fields */
  unitPrice: number;
  price: number;

  /** Exchange-specific fields */
  qualityGrade: string;
  oilUnitPrice: number;
  oilQuantity: number;
  oilTotalValue: number;
}
