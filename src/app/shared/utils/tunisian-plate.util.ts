/** Tunisian vehicle plate: 3 digits + TN + 4 digits (e.g. 258TN1234). */
export const TUNISIAN_VEHICLE_PLATE_PATTERN = /^\d{3}TN\d{4}$/;

export const TUNISIAN_VEHICLE_PLATE_MAX_LENGTH = 9;

export const TUNISIAN_VEHICLE_PLATE_EXAMPLE = '258TN1234';

export function formatTunisianPlate(raw: string | null | undefined): string {
  if (raw == null || raw === '') {
    return '';
  }

  const digits = String(raw).replace(/\D/g, '').slice(0, 7);
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(3, 7);

  if (prefix.length < 3) {
    return prefix;
  }
  if (suffix.length === 0) {
    return `${prefix}TN`;
  }
  return `${prefix}TN${suffix}`;
}

export function isValidTunisianPlate(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return TUNISIAN_VEHICLE_PLATE_PATTERN.test(String(value).toUpperCase());
}

export function normalizeTunisianPlate(value: string | null | undefined): string {
  return formatTunisianPlate(value);
}
