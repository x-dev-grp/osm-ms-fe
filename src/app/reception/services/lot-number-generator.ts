import { UnifiedDelivery } from '../../shared/models/UnifiedDelivery';
import { BaseType } from '../../shared/models/base-type';

/**
 * Generates a lot number based on the delivery's ID (or deliveryNumber), olive type code, and delivery year.
 *
 * Format: [ID as two digits][Olive Type Code][Year as two digits]
 * Example: if delivery id is 9, olive type code is "OC", and the delivery year is 2024,
 * the lot number becomes "09OC24".
 *
 * @param delivery The UnifiedDelivery object containing the id, olive type, and delivery date.
 * @returns A generated lot number string.
 * @throws An error if delivery.id is not set.
 */
export function generateLotNumber(delivery: UnifiedDelivery): string {
  // Get the olive type code from the olive variety.
  const oliveTypeCode: string = getOliveTypeCode(delivery.oliveType);
  const fullYear: number = delivery.deliveryDate.getFullYear();
  const yearPart: string = (fullYear % 100).toString().padStart(2, '0');
  const numberPart: string = delivery.deliveryNumber;

  // Combine the parts into the final lot number.
  return `${numberPart}${oliveTypeCode}${yearPart}`;
}

/**
 * Returns a short code for the given olive type.
 * Customize this function as needed to extract the correct code from your BaseType.
 *
 * @param oliveType The BaseType representing the olive type.
 * @returns A string code for the olive type (e.g., "OC").
 */
function getOliveTypeCode(oliveType: BaseType): string {
  // In a real implementation you might return oliveType.code if available.
  // For our purposes, we'll assume the name holds the required code.
  return oliveType.name;
}
