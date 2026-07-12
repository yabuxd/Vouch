import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { refreshAuthSession, supabase } from '../lib/supabase';

const REFRESH_DEBOUNCE_MS = 5000;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        const refreshed = await refreshAuthSession();
        if (!cancelled) setSession(refreshed ?? data.session);
      } else {
        setSession(null);
      }
      if (!cancelled) setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    const debouncedRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) return;
      lastRefreshRef.current = now;

      void refreshAuthSession().then((s) => {
        if (s) setSession(s);
      });
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') debouncedRefresh();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', debouncedRefresh);
    window.addEventListener('online', debouncedRefresh);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', debouncedRefresh);
      window.removeEventListener('online', debouncedRefresh);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
