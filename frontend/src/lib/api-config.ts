import { ApiError } from './errors';

const DEFAULT_API_URL = 'http://localhost:3001/api/v1';

function normalizeApiBase(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  return configured ? normalizeApiBase(configured) : DEFAULT_API_URL;
}

export function getApiConfigError(): ApiError | null {
  if (!import.meta.env.PROD) return null;

  const configured = import.meta.env.VITE_API_URL?.trim();
  if (!configured) {
    return new ApiError(
      'This deployment is missing VITE_API_URL. In Vercel → Settings → Environment Variables, set VITE_API_URL to your Render API base (example: https://vouch-zwyf.onrender.com/api/v1), then redeploy.',
      0,
      'config_error',
    );
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configured)) {
    return new ApiError(
      'VITE_API_URL points to localhost in production. In Vercel, set VITE_API_URL to https://vouch-zwyf.onrender.com/api/v1 (no trailing slash), then redeploy.',
      0,
      'config_error',
    );
  }

  return null;
}

export function createNetworkError(): ApiError {
  const apiUrl = getApiUrl();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  if (import.meta.env.PROD && /^https:\/\//i.test(apiUrl)) {
    const corsHint = origin
      ? `Set Render FRONTEND_URL to exactly ${origin} (no trailing slash).`
      : 'Set Render FRONTEND_URL to your exact Vercel site URL (no trailing slash).';

    return new ApiError(
      `Could not reach the API at ${apiUrl}. If you are online, the server may be waking up (Render free tier) or backend CORS may be misconfigured — ${corsHint}`,
      0,
      'network_error',
    );
  }

  return new ApiError(
    'Could not reach the server. Check your connection and try again.',
    0,
    'network_error',
  );
}
