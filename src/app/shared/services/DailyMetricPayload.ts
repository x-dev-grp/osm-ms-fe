import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AppParameterService } from './AppParameterService';
import { Parameter } from '../models/Parameter';

export type HistoryTuple = [string, number];

export interface DailyMetricPayload {
  current: number;
  history: HistoryTuple[];
}

export interface DailyMetricState {
  payload: DailyMetricPayload;
  todayEntry: HistoryTuple | null;
  canEditToday: boolean;
}

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function normalizeMetricValue(value: unknown): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function parseDailyMetricPayload(raw?: string | null): DailyMetricPayload {
  return parsePayload(raw);
}

function parsePayload(raw?: string | null): DailyMetricPayload {
  if (!raw?.trim()) {
    return { current: 0, history: [] };
  }

  try {
    const p = raw ? JSON.parse(raw) : null;
    const history: HistoryTuple[] = Array.isArray(p?.history)
      ? p.history
          .map((entry: unknown) => {
            if (!Array.isArray(entry) || entry.length < 2) {
              return null;
            }
            return [String(entry[0]), normalizeMetricValue(entry[1])] as HistoryTuple;
          })
          .filter(Boolean)
      : [];

    return {
      current: normalizeMetricValue(p?.current),
      history
    };
  } catch {
    return { current: 0, history: [] };
  }
}

function buildState(existing: Parameter | null): DailyMetricState {
  const payload = parsePayload(existing?.value);
  const today = todayLocalISO();
  const todayEntry = payload.history.find(([date]) => date === today) ?? null;

  return {
    payload,
    todayEntry,
    canEditToday: !todayEntry
  };
}

@Injectable({ providedIn: 'root' })
export class DailyMetricClient {
  constructor(private params: AppParameterService) {}

  get(code: string): Observable<DailyMetricPayload> {
    return this.params.getByCode(code).pipe(
      catchError(() => of(null)),
      map((existing) => parsePayload(existing?.value))
    );
  }

  getState(code: string): Observable<DailyMetricState> {
    return this.params.getByCode(code).pipe(
      catchError(() => of(null)),
      map((existing) => buildState(existing))
    );
  }

  canEditToday(code: string): Observable<boolean> {
    return this.getState(code).pipe(map((state) => state.canEditToday));
  }

  upsertToday(code: string, value: number): Observable<Parameter> {
    if (!code) {
      return throwError(() => new Error('Code parameter is required.'));
    }

    const today = todayLocalISO();
    const numericValue = normalizeMetricValue(value);
    if (numericValue < 0) {
      return throwError(() => new Error('INVALID_VALUE'));
    }

    return this.params.getByCode(code).pipe(
      catchError(() => of(null)),
      switchMap((existing: Parameter | null) => {
        if (!existing?.id) {
          return throwError(() => new Error('PARAMETER_NOT_FOUND'));
        }

        const state = buildState(existing);
        if (!state.canEditToday) {
          return throwError(() => new Error('ALREADY_ENTERED_TODAY'));
        }

        const payload: DailyMetricPayload = {
          current: numericValue,
          history: [...state.payload.history.filter(([date]) => date !== today), [today, numericValue] as HistoryTuple].sort((a, b) =>
            a[0].localeCompare(b[0])
          )
        };

        const updatedParam: Parameter = {
          ...existing,
          value: JSON.stringify(payload),
          type: existing.type || 'STRING'
        };

        return this.params.updateValue(updatedParam).pipe(
          map((response) => response?.data ?? updatedParam),
          catchError((error) => throwError(() => new Error(error?.error?.message || error?.message || 'UPDATE_FAILED')))
        );
      })
    );
  }
}
