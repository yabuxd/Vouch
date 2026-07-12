import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
  },
});

let refreshInFlight: Promise<Session | null> | null = null;

export async function refreshAuthSession(): Promise<Session | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = supabase.auth
    .refreshSession()
    .then(async ({ data, error }) => {
      if (!error && data.session) return data.session;
      const { data: fallback } = await supabase.auth.getSession();
      return fallback.session;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}
