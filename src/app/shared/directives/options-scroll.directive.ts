import {
    Directive,
    DestroyRef,
    inject,
    input,
    output,
  } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { MatAutocomplete } from '@angular/material/autocomplete';
  import { Subject } from 'rxjs';
  import { debounceTime, tap } from 'rxjs/operators';
  
  export interface IAutoCompleteScrollEvent {
    autoComplete: MatAutocomplete;
    scrollEvent: Event;
  }
  
  @Directive({
    selector: 'mat-autocomplete[optionsScroll]',
    standalone: true,
  })
  export class OptionsScrollDirective {
    private readonly destroyRef = inject(DestroyRef);
      
    thresholdPercent = input<number>(0.9);
  
    readonly optionsScroll =output<IAutoCompleteScrollEvent>();
  
    private readonly scrolled = new Subject<Event>();
  
    constructor(private readonly autoComplete: MatAutocomplete) {
      this.autoComplete.opened
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          // Wait for panel to be created
          setTimeout(() => {
            this.removeScrollEventListener();
            this.getPanel()?.addEventListener('scroll', this.onScroll);
          });
        });
  
      this.autoComplete.closed
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.removeScrollEventListener());
  
      this.scrolled
        .pipe(
          debounceTime(200),
          takeUntilDestroyed(this.destroyRef),
          tap((event: Event) => {
            const target = event.target as HTMLElement;
            const threshold = target.scrollHeight * this.thresholdPercent();
            const current = target.scrollTop + target.clientHeight;
  
            if (current >= threshold) {
              this.optionsScroll.emit({ autoComplete: this.autoComplete, scrollEvent: event });
            }
          })
        )
        .subscribe();
    }
  
    private onScroll = (event: Event) => {
      this.scrolled.next(event);
    };
  
    private removeScrollEventListener(): void {
      this.getPanel()?.removeEventListener('scroll', this.onScroll);
    }
  
    private getPanel(): HTMLElement | null {
      return this.autoComplete?.panel?.nativeElement ?? null;
    }
  }
  