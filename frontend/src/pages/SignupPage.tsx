import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/errors';
import { getAuthCallbackUrl } from '../lib/site-config';
import { agentLog } from '../lib/agent-log';
import { AuthShell } from '../components/AuthShell';

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const emailRedirectTo = getAuthCallbackUrl();
    agentLog({
      hypothesisId: 'A-B-C',
      location: 'SignupPage.tsx:signUp',
      message: 'signup redirect target',
      data: {
        emailRedirectTo,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        viteSiteUrl: import.meta.env.VITE_SITE_URL ?? null,
        host: typeof window !== 'undefined' ? window.location.host : '',
      },
    });
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo,
      },
    });
    agentLog({
      hypothesisId: 'A-B-C',
      location: 'SignupPage.tsx:signUpResult',
      message: 'signup result',
      data: {
        hasError: Boolean(err),
        errorMessage: err?.message ?? null,
        hasSession: Boolean(data?.session),
        hasUser: Boolean(data?.user),
        identitiesCount: data?.user?.identities?.length ?? null,
      },
    });
    setLoading(false);
    if (err) {
      setError(getAuthErrorMessage(err));
      return;
    }
    if (!data.session) {
      setSuccess(
        `Account created. We sent a confirmation link to ${email}. Open that link once (it expires quickly). It should open: ${emailRedirectTo}`,
      );
      return;
    }
    navigate('/dashboard');
  };

  return (
    <AuthShell
      title="Join a crew"
      subtitle="Create your account to start holding each other accountable."
      footer={
        <>
          Already in?{' '}
          <Link to="/login" className="link">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="alert-error">{error}</p>}
        {success && <p className="alert-success">{success}</p>}
        <div>
          <label className="label-caps">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label-caps">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label-caps">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-full">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
