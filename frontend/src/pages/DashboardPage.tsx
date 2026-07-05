import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Group } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { SidebarShell } from '../components/SidebarShell';
import { SidebarButton } from '../components/SidebarLink';
import { IconAddCrew, IconInvite, IconSignOut } from '../components/SidebarIcons';

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
    <SidebarShell
      title="Your crews"
      brand={
        <Link to="/dashboard" className="sidebar-brand sidebar-brand-full">
          Vouch
        </Link>
      }
      header={<p className="label-caps">Actions</p>}
      nav={
        <>
          <SidebarButton icon={<IconAddCrew />} onClick={() => { setShowCreate(true); setShowJoin(false); }}>
            Start a crew
          </SidebarButton>
          <SidebarButton icon={<IconInvite />} onClick={() => { setShowJoin(true); setShowCreate(false); }}>
            Enter invite code
          </SidebarButton>
        </>
      }
      footer={
        <SidebarButton icon={<IconSignOut />} onClick={signOut}>
          Sign out
        </SidebarButton>
      }
    >
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
    </SidebarShell>
  );
}
