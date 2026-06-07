import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-facing message from OSM backend error payloads.
 * Supports GlobalExceptionHandler, ApiResponse, and plain string bodies.
 */
export function extractHttpErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue'
): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error instanceof HttpErrorResponse) {
    const fromBody = extractMessageFromBody(error.error);
    if (fromBody) {
      return fromBody;
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
  }

  if (typeof error === 'object') {
    const fromBody = extractMessageFromBody(error);
    if (fromBody) {
      return fromBody;
    }

    const errObj = error as { message?: unknown };
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return errObj.message.trim();
    }
  }

  return fallback;
}

function extractMessageFromBody(body: unknown): string | null {
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    return normalize(body);
  }

  if (typeof body !== 'object') {
    return null;
  }

  const source = body as Record<string, unknown>;

  if (source['success'] === false && typeof source['message'] === 'string') {
    return normalize(source['message']);
  }

  const directKeys = ['message', 'error', 'error_description', 'detail', 'title'];
  for (const key of directKeys) {
    const value = source[key];
    if (typeof value === 'string') {
      const normalized = normalize(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  const nestedKeys = ['error', 'data'];
  for (const key of nestedKeys) {
    const value = source[key];
    if (value && typeof value === 'object') {
      const nested = extractMessageFromBody(value);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
