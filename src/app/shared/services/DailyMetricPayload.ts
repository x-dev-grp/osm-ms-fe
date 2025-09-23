// daily-metric.client.ts
import { Injectable } from '@angular/core';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { AppParameterService } from './AppParameterService';
import { Parameter } from '../models/Parameter';
import { tap } from 'rxjs/operators';

type HistoryTuple = [string, number];

interface DailyMetricPayload {
  current: number;
  history: HistoryTuple[];
}

function todayISO(): string {
  // Local day in Africa/Tunis (user tz). If you already run in local tz, this is fine:
  return new Date().toISOString().slice(0, 10);
}

type OldPayload = { current: number; history: [string, number][] };

// safe parser for the OLD shape; anything else -> empty
function parseOld(raw?: string | null): OldPayload {
  try {
    const p = raw ? JSON.parse(raw) : null;
    const current = Number(p?.current) || 0;
    const hist: [string, number][] = Array.isArray(p?.history)
      ? (p.history.map((a: any) => (Array.isArray(a) ? ([String(a[0]), Number(a[1]) || 0] as [string, number]) : null)).filter(Boolean) as [
          string,
          number
        ][])
      : [];
    return { current, history: hist };
  } catch {
    return { current: 0, history: [] };
  }
}

function parsePayload(raw?: string | null): DailyMetricPayload {
  try {
    const p = raw ? JSON.parse(raw) : null;
    if (!p || !Array.isArray(p.history)) return { current: Number(p?.current ?? 0) || 0, history: [] };
    return { current: Number(p.current) || 0, history: p.history as HistoryTuple[] };
  } catch {
    return { current: 0, history: [] };
  }
}

@Injectable({ providedIn: 'root' })
export class DailyMetricClient {
  constructor(private params: AppParameterService) {}

  /** Quick read */
  get(code: string) {
    return this.params.getByCode(code).pipe(map((p) => parsePayload(p?.value)));
  }

  /** Whether today's entry exists (used to disable UI) */
  canEditToday(code: string) {
    const t = todayISO();
    return this.params.getByCode(code).pipe(
      catchError(() => of(null)),
      map((existing) => {
        const payload = parsePayload(existing?.value);
        const hasToday = payload.history.some(([d]) => d === t);
        return !hasToday; // can edit only if no entry for today
      })
    );
  }

  /**
   * Upsert today's value ONLY IF it hasn't been set today.
   * Pass `force=true` to allow updates on the same day (e.g., admin override).
   */
  upsertToday(code: string, value: number) {
    const t = todayISO(); // e.g., "2025-09-22"
    const v = Number(value) || 0;

    return this.params.getByCode(code).pipe(
      catchError(() => of(null)),
      switchMap((existing: Parameter | null) => {
        const payload = parsePayload(existing?.value);
        const hasToday = payload.history.some(([d]) => d === t);

        if (hasToday) {
          return throwError(() => new Error('Déjà saisi pour aujourd’hui.'));
        }

        // Update current & history
        payload.current = v;
        payload.history = payload.history.filter(([d]) => d !== t);
        payload.history.push([t, v]);
        payload.history = payload.history.sort((a, b) => a[0].localeCompare(b[0]));

        // Create updated parameter
        const updatedParam = { ...existing, value: JSON.stringify(payload) } as Parameter;

        return this.params.updateValue(updatedParam).pipe(
          tap((res) => {
            const updated = res.data[0]; // Match save method's response structure
          })
        );
      })
    );
  }
}
