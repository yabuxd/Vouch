import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/errors';
import { AuthShell } from '../components/AuthShell';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(getAuthErrorMessage(err));
      return;
    }
    navigate('/dashboard');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your crew."
      footer={
        <>
          No account?{' '}
          <Link to="/signup" className="link">Join Vouch</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="alert-error">{error}</p>}
        <div>
          <label className="label-caps">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="label-caps">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
