import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isValidTunisianPlate, TUNISIAN_VEHICLE_PLATE_PATTERN } from '../utils/tunisian-plate.util';

export function tunisianPlateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || value === '') {
      return null;
    }
    return isValidTunisianPlate(value) ? null : { pattern: true };
  };
}

export const tunisianPlateRequiredValidators = [Validators.required, Validators.pattern(TUNISIAN_VEHICLE_PLATE_PATTERN)];

export const tunisianPlateOptionalValidators = [Validators.pattern(TUNISIAN_VEHICLE_PLATE_PATTERN)];
