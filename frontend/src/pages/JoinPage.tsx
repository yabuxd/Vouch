import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, type Group } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const code = searchParams.get('code') ?? '';
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!authLoading && session && code) {
      setJoining(true);
      api<{ group: Group }>('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: code }),
      })
        .then(({ group }) => navigate(`/groups/${group.id}`))
        .catch((err) => setError(err.message))
        .finally(() => setJoining(false));
    }
  }, [authLoading, session, code, navigate]);

  if (authLoading || joining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-ink-muted">Joining crew…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Join a crew</h1>
          <p className="mt-3 text-sm text-ink-muted">
            Sign in first. Invite code: <span className="font-mono tracking-widest">{code || '—'}</span>
          </p>
          <button
            onClick={() =>
              navigate('/login', {
                state: { from: { pathname: '/join', search: code ? `?code=${encodeURIComponent(code)}` : '' } },
              })
            }
            className="btn btn-primary mt-8"
          >
            Sign in to join
          </button>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Missing invite code</h1>
          <p className="mt-3 text-sm text-ink-muted">Open the invite link you were sent, or join from the dashboard.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-8">
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      {error ? <p className="alert-error">{error}</p> : <p className="text-sm text-ink-muted">Redirecting…</p>}
    </div>
  );
}
