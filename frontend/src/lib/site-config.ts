function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();

if (import.meta.env.PROD && !configuredSiteUrl) {
  console.error(
    '[Vouch] VITE_SITE_URL is missing in this production build. ' +
      'Signup emailRedirectTo will use window.location.origin, but Supabase email links use dashboard Site URL — ' +
      'if that is still localhost, confirmation emails open localhost. Set VITE_SITE_URL on Vercel and fix Supabase URL Configuration (see supabase/AUTH_SETUP.md).',
  );
}

/** Public site origin used for Supabase auth redirects (signup confirm, etc.). */
export function getSiteUrl(): string {
  if (configuredSiteUrl) return normalizeOrigin(configuredSiteUrl);
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (import.meta.env.PROD && /localhost|127\.0\.0\.1/i.test(origin)) {
      console.error(
        '[Vouch] Production app is running on localhost. Confirmation redirects will target localhost. ' +
          'Set VITE_SITE_URL to your Vercel URL and redeploy.',
      );
    }
    return origin;
  }
  return '';
}

/** Supabase emailRedirectTo target after the user confirms (PKCE callback). */
export function getAuthCallbackUrl(): string {
  const site = getSiteUrl();
  return site ? `${site}/auth/callback` : '/auth/callback';
}
