import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'sortByTranslated',
  standalone: true,
  // impure so it re-sorts when language changes
  pure: false
})
export class SortByTranslatedPipe implements PipeTransform, OnDestroy {
  private collator = new Intl.Collator(this.translate.currentLang || this.translate.getDefaultLang() || undefined, { sensitivity: 'base' });
  private sub: Subscription;

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this.sub = this.translate.onLangChange.subscribe((ev) => {
      this.collator = new Intl.Collator(ev.lang, { sensitivity: 'base' });
      this.cdr.markForCheck();
    });
  }

  // IMPORTANT: return type is string[]
  transform(value: unknown, keyPrefix = ''): string[] {
    if (!value) return [];

    // Normalize to string[]
    let arr: string[];
    if (Array.isArray(value)) {
      arr = value.map((v) => String(v));
    } else if (value instanceof Set) {
      arr = Array.from(value).map((v) => String(v));
    } else if (typeof (value as any)[Symbol.iterator] === 'function') {
      arr = Array.from(value as Iterable<unknown>).map((v) => String(v));
    } else {
      arr = [];
    }

    // Sort by translated label (fallback to raw if not translated yet)
    return arr.sort((a, b) => {
      const ak = keyPrefix + a;
      const bk = keyPrefix + b;
      const at = this.translate.instant(ak);
      const bt = this.translate.instant(bk);
      const aLabel = at && at !== ak ? at : a;
      const bLabel = bt && bt !== bk ? bt : b;

      const byLabel = this.collator.compare(aLabel, bLabel);
      return byLabel !== 0 ? byLabel : a.localeCompare(b);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
