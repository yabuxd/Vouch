import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, toUserErrorMessage } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { AuthShell } from '../components/AuthShell';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const hasHashTokens =
        hashParams.has('access_token') || hashParams.has('error') || hashParams.has('error_description');

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (hasHashTokens) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session) {
            const description = hashParams.get('error_description');
            throw new Error(description ?? 'Invalid or expired confirmation link.');
          }
        } else {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session) {
            throw new Error('Invalid or expired confirmation link.');
          }
        }

        if (!cancelled) navigate('/dashboard', { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(
            err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string' && 'status' in err
              ? getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0])
              : toUserErrorMessage(err),
          );
          setConfirming(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (confirming && !error) {
    return (
      <AuthShell title="Confirming your email" subtitle="Hang tight — we're verifying your account.">
        <p className="text-sm text-ink-muted">This usually takes a moment.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Confirmation failed"
      subtitle="We couldn't verify your email from that link."
      footer={
        <>
          <Link to="/login" className="link">
            Sign in
          </Link>
          {' · '}
          <Link to="/signup" className="link">
            Create account
          </Link>
        </>
      }
    >
      {error && <p className="alert-error">{error}</p>}
      <p className="text-sm text-ink-muted">
        Links expire after a while. Request a new confirmation email by signing up again, or sign in if
        your account is already verified.
      </p>
    </AuthShell>
  );
}
