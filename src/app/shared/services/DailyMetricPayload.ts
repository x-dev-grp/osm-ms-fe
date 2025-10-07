// daily-metric.client.ts
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AppParameterService } from './AppParameterService';
import { Parameter } from '../models/Parameter';

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
  upsertToday(code: string, value: number): Observable<any> {
    if (!code) {
      throw new Error('Code parameter is required.');
    }

    const t = todayISO(); // e.g., "2025-10-05"
    const v = Number(value) || 0;

    return this.params.getByCode(code).pipe(
      catchError((error) => {
        console.warn(`Failed to get parameter by code ${code}:`, error);
        return of(null);
      }),
      switchMap((existing: Parameter | null) => {
        let payload = { current: 0, history: [] as [string, number][] };
        if (existing?.value) {
          const parsed = parsePayload(existing.value);
          payload = { ...payload, ...parsed, history: parsed.history || [] };
        }

        const hasToday = payload.history.some(([d]) => d === t);
        if (hasToday) {
          return throwError(() => new Error('Déjà saisi pour aujourd’hui.'));
        }

        // Update current & history
        payload.current = v;
        payload.history = payload.history.filter(([d]) => d !== t);
        payload.history.push([t, v]);
        payload.history.sort((a, b) => a[0].localeCompare(b[0]));

        // Create updated parameter with default values if existing is null
        const updatedParam: Parameter = {
          id: existing?.id!  , // Generate a temporary ID if none
          tenantId: existing?.tenantId || '', // Default tenantId, adjust as needed
          code: code, // Use the input code directly
          category: existing?.category || 'DEFAULT', // Default category, adjust as needed
          value: JSON.stringify(payload),
          type: existing?.type || 'DOUBLE', // Default to DOUBLE, adjust based on context
          description: existing?.description || 'Daily metric value',
          isActive: existing?.isActive || true,
          createdBy: existing?.createdBy,
          updatedBy: existing?.updatedBy
        };
        console.log('Sending updatedParam:', updatedParam); // Moved logging here for debugging

        return this.params.updateValue(updatedParam).pipe(
          catchError((error) => {
            console.error('Update failed with error:', error);
            return throwError(() => new Error('Échec de la mise à jour: ' + (error.message || 'Unknown reason')));
          })
        );
      })
    );
  }
}
