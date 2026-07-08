import { Directive, ElementRef, HostListener, inject, OnInit, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatTunisianPlate, TUNISIAN_VEHICLE_PLATE_MAX_LENGTH } from '../utils/tunisian-plate.util';

@Directive({
  selector: 'input[appTunisianPlateMask]',
  standalone: true
})
export class TunisianPlateMaskDirective implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  constructor(@Optional() @Self() private readonly ngControl: NgControl) {}

  ngOnInit(): void {
    const input = this.elementRef.nativeElement;
    input.maxLength = TUNISIAN_VEHICLE_PLATE_MAX_LENGTH;
    input.autocapitalize = 'characters';
    input.spellcheck = false;

    const current = this.ngControl?.control?.value ?? input.value;
    const formatted = formatTunisianPlate(current);
    if (formatted && formatted !== current) {
      this.applyFormattedValue(formatted, formatted.length);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBefore = input.value.slice(0, cursor).replace(/\D/g, '').length;
    const formatted = formatTunisianPlate(input.value);

    if (formatted === input.value) {
      return;
    }

    const nextCursor = this.resolveCursor(digitsBefore, formatted);
    this.applyFormattedValue(formatted, nextCursor);
  }

  @HostListener('blur')
  onBlur(): void {
    const input = this.elementRef.nativeElement;
    const formatted = formatTunisianPlate(input.value);
    if (formatted !== input.value) {
      this.applyFormattedValue(formatted, formatted.length);
    }
  }

  private applyFormattedValue(value: string, cursor: number): void {
    const input = this.elementRef.nativeElement;
    input.value = value;
    this.ngControl?.control?.setValue(value, { emitEvent: false });
    const safeCursor = Math.min(Math.max(cursor, 0), value.length);
    input.setSelectionRange(safeCursor, safeCursor);
  }

  private resolveCursor(digitsBeforeCursor: number, formatted: string): number {
    if (digitsBeforeCursor <= 0) {
      return 0;
    }
    if (digitsBeforeCursor <= 3) {
      return digitsBeforeCursor;
    }
    // digits 4+ map after the "TN" separator
    return Math.min(3 + 2 + (digitsBeforeCursor - 3), formatted.length);
  }
}
