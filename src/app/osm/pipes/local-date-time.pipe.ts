// local-date-time.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'localDateTime'
})

export class LocalDateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): Date | null {
    // 1. If no value, return null
    if (!value) {
      return null;
    }

    // 2. If it's already a Date, just return it
    if (value instanceof Date) {
      return value;
    }

    // 3. If it's a string in "yyyy,MM,dd,HH,mm,ss..." format, parse it
    if (typeof value === 'string') {
      const parts = value.split(',');
      if (parts.length < 6) {
        return null;
      }
      const year = +parts[0];
      const month = (+parts[1]) - 1; // zero-based in JS
      const day = +parts[2];
      const hour = +parts[3];
      const minute = +parts[4];
      const second = +parts[5];
      return new Date(year, month, day, hour, minute, second);
    }

    // 4. Otherwise, not recognized => return null (or throw an error if you prefer)
    return null;
  }
}
