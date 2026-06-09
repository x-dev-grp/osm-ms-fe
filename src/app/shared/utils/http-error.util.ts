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
    const messages = collectHttpErrorMessages(error);
    if (messages.length) {
      return messages.join(' — ');
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
  }

  if (typeof error === 'object') {
    const messages = collectHttpErrorMessages(error);
    if (messages.length) {
      return messages.join(' — ');
    }

    const errObj = error as { message?: unknown };
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return errObj.message.trim();
    }
  }

  return fallback;
}

function collectHttpErrorMessages(error: unknown): string[] {
  if (!error) {
    return [];
  }

  if (typeof error === 'string') {
    const normalized = normalize(error);
    return normalized ? [normalized] : [];
  }

  if (error instanceof HttpErrorResponse) {
    return collectMessagesFromBody(error.error);
  }

  if (typeof error === 'object') {
    return collectMessagesFromBody(error);
  }

  return [];
}

function collectMessagesFromBody(body: unknown): string[] {
  if (!body) {
    return [];
  }

  if (typeof body === 'string') {
    const normalized = normalize(body);
    return normalized ? [normalized] : [];
  }

  if (typeof body !== 'object') {
    return [];
  }

  const source = body as Record<string, unknown>;
  const messages: string[] = [];

  const add = (value: string | null | undefined) => {
    const normalized = normalize(value);
    if (!normalized || isGenericHttpError(normalized)) {
      return;
    }
    if (!messages.some((existing) => existing === normalized)) {
      messages.push(normalized);
    }
  };

  if (source['success'] === false) {
    add(typeof source['message'] === 'string' ? source['message'] : null);
  }

  const directKeys = ['message', 'error', 'error_description', 'detail', 'title'];
  for (const key of directKeys) {
    const value = source[key];
    if (typeof value === 'string') {
      add(value);
    }
  }

  const nestedKeys = ['error', 'data'];
  for (const key of nestedKeys) {
    const value = source[key];
    if (value && typeof value === 'object') {
      collectMessagesFromBody(value).forEach((nested) => add(nested));
    }
  }

  return messages;
}

function isGenericHttpError(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'bad request'
    || normalized === 'internal server error'
    || normalized === 'not found'
    || normalized === 'forbidden'
    || normalized === 'unauthorized';
}

function normalize(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
