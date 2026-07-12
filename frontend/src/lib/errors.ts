import type { AuthError } from '@supabase/supabase-js';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'api_error') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return 'Something went wrong';
  if (error.message) return error.message;

  const extra = error as unknown as Record<string, unknown>;
  if (typeof extra.msg === 'string') return extra.msg;
  if (typeof extra.error_description === 'string') return extra.error_description;

  return 'Authentication failed. Please try again.';
}

export function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;

  const record = data as Record<string, unknown>;
  const err = record.error;

  if (typeof err === 'string' && err.length > 0) return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  if (typeof record.message === 'string' && record.message.length > 0) {
    return record.message;
  }
  if (typeof record.msg === 'string' && record.msg.length > 0) return record.msg;

  return fallback;
}

export function statusFallback(status: number): string {
  switch (status) {
    case 400:
      return 'That request was invalid. Check your input and try again.';
    case 401:
      return 'Your session expired. Sign in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return 'That conflicts with existing data. Refresh and try again.';
    case 413:
      return 'That upload is too large.';
    case 429:
      return 'Too many requests. Wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'The server hit a snag. Try again in a moment.';
    default:
      return status >= 500 ? 'Server error. Try again shortly.' : 'Request failed. Try again.';
  }
}

export function toUserErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) {
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return 'Could not reach the server. Check your connection and try again.';
    }
    return err.message;
  }
  return 'Something went wrong. Try again.';
}
