import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { AppParameterService } from './AppParameterService';

export interface SeasonPricingRule {
  from?: string;
  to?: string;
  variety?: string;
  pricePerKg?: number;
}

@Injectable({ providedIn: 'root' })
export class TenantParameterClient {
  private readonly params = inject(AppParameterService);

  getString(code: string, fallback = ''): Observable<string> {
    return this.params.getByCode(code).pipe(
      map((p) => (p?.value ?? '').trim() || fallback),
      catchError(() => of(fallback))
    );
  }

  getBoolean(code: string, fallback = true): Observable<boolean> {
    return this.getString(code, String(fallback)).pipe(
      map((value) => {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes'].includes(normalized)) {
          return true;
        }
        if (['false', '0', 'no'].includes(normalized)) {
          return false;
        }
        return fallback;
      })
    );
  }

  getNumber(code: string, fallback = 0): Observable<number> {
    return this.getString(code, String(fallback)).pipe(
      map((value) => {
        const parsed = Number(String(value).replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : fallback;
      })
    );
  }

  resolveTriturationPrice(onDate: Date, varietyName?: string | null): Observable<number> {
    return this.params.getByCode('SEASON_PRICING_RULES').pipe(
      map((param) => {
        const rules = this.parseSeasonRules(param?.value);
        const matched = rules.find((rule) => this.ruleMatches(rule, onDate, varietyName));
        if (matched?.pricePerKg != null && Number.isFinite(Number(matched.pricePerKg))) {
          return Number(matched.pricePerKg);
        }
        return null as number | null;
      }),
      catchError(() => of(null as number | null)),
      switchMap((seasonPrice) => (seasonPrice != null ? of(seasonPrice) : this.getNumber('PRIX_TRITURATION_KG', 0.17)))
    );
  }

  private parseSeasonRules(raw?: string | null): SeasonPricingRule[] {
    if (!raw?.trim()) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private ruleMatches(rule: SeasonPricingRule, onDate: Date, varietyName?: string | null): boolean {
    const dateIso = this.toIsoDate(onDate);
    if (rule.from && dateIso < rule.from) {
      return false;
    }
    if (rule.to && dateIso > rule.to) {
      return false;
    }
    const ruleVariety = (rule.variety ?? '').trim().toLowerCase();
    if (!ruleVariety || ruleVariety === '*') {
      return true;
    }
    return ruleVariety === (varietyName ?? '').trim().toLowerCase();
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
