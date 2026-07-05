import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Group } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<Group[]>('/groups')
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const group = await api<Group>('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      setShowCreate(false);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { group } = await api<{ group: Group }>('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      setShowJoin(false);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col justify-between border-r border-rule bg-raised p-8 md:flex">
        <div>
          <Link to="/dashboard" className="font-display text-2xl font-bold text-ink">Vouch</Link>
          <p className="mt-6 label-caps">Actions</p>
          <div className="mt-3 flex flex-col gap-2">
            <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn btn-accent text-left">
              Start a crew
            </button>
            <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn btn-ghost text-left">
              Enter invite code
            </button>
          </div>
        </div>
        <button onClick={signOut} className="text-left text-sm text-ink-muted hover:text-ink">
          Sign out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="panel flex items-center justify-between px-6 py-4 md:hidden">
          <span className="font-display text-xl font-bold text-ink">Vouch</span>
          <button onClick={signOut} className="text-sm text-ink-muted">Sign out</button>
        </header>

        <main className="flex-1 px-6 py-10 md:pl-12 md:pr-16 lg:pr-24">
          <div className="md:hidden mb-8 flex gap-2">
            <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn btn-accent flex-1">Start a crew</button>
            <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn btn-ghost flex-1">Join</button>
          </div>

          {error && <p className="alert-error mb-6">{error}</p>}

          {showCreate && (
            <form onSubmit={createGroup} className="panel-inset mb-10 space-y-4">
              <p className="label-caps">New crew</p>
              <input placeholder="Crew name" value={name} onChange={(e) => setName(e.target.value)} required className="input" />
              <textarea placeholder="What's this crew about? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="textarea" rows={2} />
              <button type="submit" className="btn btn-primary">Create crew</button>
            </form>
          )}

          {showJoin && (
            <form onSubmit={joinGroup} className="panel-inset mb-10 space-y-4">
              <p className="label-caps">Invite code</p>
              <input placeholder="XXXXXXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required className="input font-mono uppercase tracking-widest" />
              <button type="submit" className="btn btn-primary">Join crew</button>
            </form>
          )}

          <p className="label-caps">Your crews</p>
          {loading ? (
            <p className="mt-6 text-sm text-ink-muted">Pulling your groups…</p>
          ) : groups.length === 0 ? (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
              No crews yet — start one or ask a friend for an invite code.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-rule">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link to={`/groups/${g.id}`} className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-raised/80">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-ink">{g.name}</h3>
                      {g.description && <p className="mt-0.5 truncate text-sm text-ink-muted">{g.description}</p>}
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="font-mono font-medium text-accent">{g.my_points ?? 0} pts</p>
                      {(g.my_streak ?? 0) > 0 && (
                        <p className="mt-0.5 text-streak">{g.my_streak}d streak</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink-muted">{g.my_role}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
