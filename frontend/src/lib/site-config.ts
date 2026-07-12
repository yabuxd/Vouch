function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/** Public site origin used for Supabase auth redirects (signup confirm, etc.). */
export function getSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  if (configured) return normalizeOrigin(configured);
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function getAuthCallbackUrl(): string {
  const site = getSiteUrl();
  return site ? `${site}/auth/callback` : '/auth/callback';
}
