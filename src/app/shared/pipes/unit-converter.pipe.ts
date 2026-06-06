import { Pipe, PipeTransform } from '@angular/core';

export type UnitType = 'KG' | 'L';

export interface OilType {
  name: string;
  density: number; // kg/L
  description?: string;
}

@Pipe({
  name: 'unitConverter',
  standalone: true
})
export class UnitConverterPipe implements PipeTransform {

  // Predefined oil types with their densities
  private readonly OIL_TYPES: { [key: string]: OilType } = {
    'OLIVE_OIL': {
      name: 'Olive Oil',
      density: 0.92,
      description: 'Extra virgin olive oil'
    },
    'REFINED_OLIVE_OIL': {
      name: 'Refined Olive Oil',
      density: 0.91,
      description: 'Refined olive oil'
    },
    'POMACE_OLIVE_OIL': {
      name: 'Pomace Olive Oil',
      density: 0.90,
      description: 'Olive pomace oil'
    },
    'VEGETABLE_OIL': {
      name: 'Vegetable Oil',
      density: 0.92,
      description: 'Generic vegetable oil'
    },
    'SUNFLOWER_OIL': {
      name: 'Sunflower Oil',
      density: 0.92,
      description: 'Sunflower oil'
    },
    'CORN_OIL': {
      name: 'Corn Oil',
      density: 0.92,
      description: 'Corn oil'
    }
  };

  // Default oil type
  private readonly DEFAULT_OIL_TYPE = 'OLIVE_OIL';

  /**
   * Converts quantity between kilograms and liters
   * @param value The quantity to convert
   * @param fromUnit The source unit ('KG' or 'L')
   * @param toUnit The target unit ('KG' or 'L')
   * @param oilType The type of oil (optional, defaults to olive oil)
   * @param precision Number of decimal places (default: 2)
   * @returns Converted quantity
   */
  transform(value: number | null | undefined, fromUnit: UnitType, toUnit: UnitType, oilType?: string, precision: number = 2): number {
    // Handle null/undefined values
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }

    // If same unit, return original value
    if (fromUnit === toUnit) {
      return this.roundToPrecision(value, precision);
    }

    // Get density for the specified oil type
    const density = this.getDensityForOilType(oilType);
    let convertedValue: number;

    if (fromUnit === 'KG' && toUnit === 'L') {
      // Convert kilograms to liters: L = KG / density
      convertedValue = value / density;
    } else if (fromUnit === 'L' && toUnit === 'KG') {
      // Convert liters to kilograms: KG = L * density
      convertedValue = value * density;
    } else {
      // Invalid conversion
      console.warn(`[UnitConverterPipe] Invalid conversion from ${fromUnit} to ${toUnit}`);
      return value;
    }

    return this.roundToPrecision(convertedValue, precision);
  }

  /**
   * Converts quantity and returns formatted string with unit
   * @param value The quantity to convert
   * @param fromUnit The source unit ('KG' or 'L')
   * @param toUnit The target unit ('KG' or 'L')
   * @param oilType The type of oil (optional, defaults to olive oil)
   * @param precision Number of decimal places (default: 2)
   * @returns Formatted string with converted quantity and unit
   */
  transformWithUnit(value: number | null | undefined, fromUnit: UnitType, toUnit: UnitType, oilType?: string, precision: number = 2): string {
    const convertedValue = this.transform(value, fromUnit, toUnit, oilType, precision);
    return `${convertedValue.toFixed(precision)} ${toUnit}`;
  }

  /**
   * Converts quantity and returns formatted string with unit and oil type info
   * @param value The quantity to convert
   * @param fromUnit The source unit ('KG' or 'L')
   * @param toUnit The target unit ('KG' or 'L')
   * @param oilType The type of oil
   * @param precision Number of decimal places (default: 2)
   * @returns Formatted string with converted quantity, unit, and oil type
   */
  transformWithUnitAndOilType(value: number | null | undefined, fromUnit: UnitType, toUnit: UnitType, oilType: string, precision: number = 2): string {
    const convertedValue = this.transform(value, fromUnit, toUnit, oilType, precision);
    const oilTypeInfo = this.getOilTypeInfo(oilType);
    return `${convertedValue.toFixed(precision)} ${toUnit} (${oilTypeInfo.name})`;
  }

  /**
   * Gets the density for a specific oil type
   * @param oilType The oil type key
   * @returns Density in kg/L
   */
  getDensityForOilType(oilType?: string): number {
    if (!oilType || !this.OIL_TYPES[oilType]) {
      return this.OIL_TYPES[this.DEFAULT_OIL_TYPE].density;
    }
    return this.OIL_TYPES[oilType].density;
  }

  /**
   * Gets information about an oil type
   * @param oilType The oil type key
   * @returns Oil type information
   */
  getOilTypeInfo(oilType?: string): OilType {
    if (!oilType || !this.OIL_TYPES[oilType]) {
      return this.OIL_TYPES[this.DEFAULT_OIL_TYPE];
    }
    return this.OIL_TYPES[oilType];
  }

  /**
   * Gets all available oil types
   * @returns Array of oil type keys
   */
  getAvailableOilTypes(): string[] {
    return Object.keys(this.OIL_TYPES);
  }

  /**
   * Gets all oil type information
   * @returns Array of oil type objects
   */
  getAllOilTypes(): OilType[] {
    return Object.values(this.OIL_TYPES);
  }

  /**
   * Adds a custom oil type
   * @param key The oil type key
   * @param oilType The oil type information
   */
  addOilType(key: string, oilType: OilType): void {
    this.OIL_TYPES[key] = oilType;
  }

  /**
   * Rounds a number to specified precision
   * @param value The number to round
   * @param precision Number of decimal places
   * @returns Rounded number
   */
  private roundToPrecision(value: number, precision: number): number {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  }
}
