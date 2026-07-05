import type { AuthError } from '@supabase/supabase-js';

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
