import { message } from 'antd';
import { createElement, Fragment } from 'react';

/**
 * Backend envelope on failure: `{ success: false, code, message, error }`.
 * `message` is always a string; `error` is a field -> string[] map on validation
 * (422) failures, or empty (`{}`/`[]`) otherwise — never user-facing text by itself.
 */
function extractFieldErrors(error: unknown): string[] {
  if (!error || typeof error !== 'object' || Array.isArray(error)) return [];

  return Object.values(error as Record<string, unknown>)
    .filter(
      (value): value is string[] =>
        Array.isArray(value) && value.every((v) => typeof v === 'string'),
    )
    .flat();
}

function buildErrorContent(text: string | undefined, fieldErrors: string[]) {
  if (!text) return undefined;
  if (fieldErrors.length === 0) return text;

  return createElement(
    Fragment,
    null,
    createElement('div', null, text),
    ...fieldErrors.map((fieldError, index) =>
      createElement('div', { key: index }, fieldError),
    ),
  );
}

/**
 * Shows the real backend error (string `message` plus any field-level `error`
 * messages, one per line) as an antd toast. Falls back to a generic message only
 * when the response body has no readable `message` (network failure / non-JSON body).
 */
export function showApiError(error: unknown): void {
  const data = (
    error as { response?: { data?: { message?: string; error?: unknown } } }
  )?.response?.data;
  const fieldErrors = extractFieldErrors(data?.error);
  const content = buildErrorContent(data?.message, fieldErrors);

  message.error(
    content ?? 'ارتباط با سرور برقرار نشد یا پاسخ نامعتبر بود',
    fieldErrors.length > 0 ? 5 : 3,
  );
}
