import { AbstractControl } from '@angular/forms';

export const netNotGreater = (group: AbstractControl) => {
  const brut = group.get('poidsBrute')!.value;
  const net  = group.get('poidsNet')!.value;
  return net != null && brut != null && net > brut
    ? { netGreater: true }
    : null;
};
