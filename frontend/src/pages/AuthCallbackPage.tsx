import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, toUserErrorMessage } from '../lib/errors';
import { agentLog } from '../lib/agent-log';
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
      agentLog({
        hypothesisId: 'D-E',
        location: 'AuthCallbackPage.tsx:start',
        message: 'auth callback entry',
        data: {
          origin: window.location.origin,
          pathname: window.location.pathname,
          hasCode: Boolean(code),
          hashError: hashParams.get('error'),
          hashErrorCode: hashParams.get('error_code'),
          hashErrorDescription: hashParams.get('error_description'),
          hasHashTokens,
        },
      });

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (hasHashTokens) {
          if (hashParams.get('error')) {
            throw new Error(hashParams.get('error_description') ?? hashParams.get('error') ?? 'Confirmation failed');
          }
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

        agentLog({
          hypothesisId: 'D-E',
          location: 'AuthCallbackPage.tsx:success',
          message: 'auth callback success',
          data: { ok: true },
          runId: 'post-fix',
        });
        if (!cancelled) navigate('/dashboard', { replace: true });
      } catch (err) {
        agentLog({
          hypothesisId: 'D-E',
          location: 'AuthCallbackPage.tsx:error',
          message: 'auth callback failed',
          data: { error: err instanceof Error ? err.message : String(err) },
        });
        if (!cancelled) {
          const raw =
            err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string' && 'status' in err
              ? getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0])
              : toUserErrorMessage(err);
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const code = hashParams.get('error_code');
          const friendly =
            code === 'otp_expired' || /invalid or has expired/i.test(raw)
              ? 'This confirmation link is invalid or was already used (email apps sometimes open it automatically). Sign up again to get a fresh link. Also set Supabase Site URL to your Vercel domain — not localhost.'
              : raw;
          setError(friendly);
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
