import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getAuthErrorMessage, toUserErrorMessage } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { AuthShell } from '../components/AuthShell';

/**
 * Prefetch-safe confirmation landing page.
 * Email scanners GET this page without clicking; OTP is only consumed on button click.
 */
export function AuthConfirmPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const payload = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      confirmationUrl: params.get('confirmation_url'),
      tokenHash: params.get('token_hash'),
      type: (params.get('type') as EmailOtpType | null) ?? 'signup',
    };
  }, []);

  const confirm = async () => {
    setBusy(true);
    setError('');
    // #region agent log
    fetch('http://127.0.0.1:7530/ingest/e6f5fe77-9e75-413a-a6e5-206191b52f12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'78e600'},body:JSON.stringify({sessionId:'78e600',runId:'post-fix',hypothesisId:'D',location:'AuthConfirmPage.tsx:confirm',message:'user clicked confirm',data:{hasConfirmationUrl:Boolean(payload.confirmationUrl),hasTokenHash:Boolean(payload.tokenHash),type:payload.type,origin:window.location.origin},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    try {
      if (payload.confirmationUrl) {
        window.location.assign(payload.confirmationUrl);
        return;
      }

      if (payload.tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: payload.tokenHash,
          type: payload.type || 'signup',
        });
        if (verifyError) throw verifyError;
        // #region agent log
        fetch('http://127.0.0.1:7530/ingest/e6f5fe77-9e75-413a-a6e5-206191b52f12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'78e600'},body:JSON.stringify({sessionId:'78e600',runId:'post-fix',hypothesisId:'D',location:'AuthConfirmPage.tsx:verified',message:'verifyOtp success',data:{ok:true},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        navigate('/dashboard', { replace: true });
        return;
      }

      throw new Error('Missing confirmation details. Request a new signup email.');
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7530/ingest/e6f5fe77-9e75-413a-a6e5-206191b52f12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'78e600'},body:JSON.stringify({sessionId:'78e600',runId:'post-fix',hypothesisId:'D',location:'AuthConfirmPage.tsx:error',message:'confirm failed',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setError(
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string' && 'status' in err
          ? getAuthErrorMessage(err as Parameters<typeof getAuthErrorMessage>[0])
          : toUserErrorMessage(err),
      );
      setBusy(false);
    }
  };

  const canConfirm = Boolean(payload.confirmationUrl || payload.tokenHash);

  return (
    <AuthShell
      title="Confirm your email"
      subtitle="Click the button below to finish creating your account."
      footer={
        <>
          <Link to="/login" className="link">
            Sign in
          </Link>
          {' · '}
          <Link to="/signup" className="link">
            Sign up again
          </Link>
        </>
      }
    >
      {error && <p className="alert-error mb-4">{error}</p>}
      {!canConfirm && (
        <p className="alert-error mb-4">
          This confirmation link is incomplete. Sign up again to get a fresh email.
        </p>
      )}
      <button type="button" className="btn btn-primary btn-full" disabled={!canConfirm || busy} onClick={confirm}>
        {busy ? 'Confirming…' : 'Confirm email'}
      </button>
      <p className="mt-4 text-sm text-ink-muted">
        We ask you to click here so email security scanners cannot use up your one-time link.
      </p>
    </AuthShell>
  );
}
