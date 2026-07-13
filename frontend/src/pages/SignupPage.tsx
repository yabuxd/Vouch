import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/errors';
import { getAuthCallbackUrl } from '../lib/site-config';
import { AuthShell } from '../components/AuthShell';

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const emailRedirectTo = getAuthCallbackUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo,
      },
    });
    setLoading(false);
    if (err) {
      setError(getAuthErrorMessage(err));
      return;
    }
    if (!data.session) {
      setSuccess(
        `Account created. Check ${email} for a confirmation link, then click Confirm email on the page that opens. (Do not reuse old emails.)`,
      );
      return;
    }
    navigate('/dashboard');
  };

  const resendConfirmation = async () => {
    if (!email.trim()) {
      setError('Enter your email above, then resend.');
      return;
    }
    setResending(true);
    setError('');
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo },
    });
    setResending(false);
    if (err) {
      setError(getAuthErrorMessage(err));
      return;
    }
    setSuccess(`A new confirmation email was sent to ${email}. Open the newest message only.`);
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
        {success && (
          <button type="button" disabled={resending} className="btn btn-ghost btn-full" onClick={resendConfirmation}>
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
        )}
      </form>
    </AuthShell>
  );
}
