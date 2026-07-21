import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Group } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { useAuth } from '../hooks/useAuth';
import { SidebarShell } from '../components/SidebarShell';
import { SidebarLink, SidebarButton } from '../components/SidebarLink';
import { IconAddCrew, IconInvite, IconSignOut } from '../components/SidebarIcons';
import { CrewListSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';
import { NotificationBell } from '../components/NotificationBell';
import { InsightsPanel } from '../components/InsightsPanel';
import { useTimezoneSync } from '../hooks/useTimezoneSync';

export function DashboardPage() {
  const { signOut } = useAuth();
  useTimezoneSync();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const loadGroups = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    api<Group[]>('/groups')
      .then(setGroups)
      .catch((err) => setLoadError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const group = await api<Group>('/groups', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      });
      setShowCreate(false);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { group } = await api<{ group: Group }>('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      setShowJoin(false);
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="error-page">
        <ErrorState error={loadError} onRetry={loadGroups} />
      </div>
    );
  }

  return (
    <SidebarShell
      title="Your crews"
      brand={
        <Link to="/dashboard" className="sidebar-brand sidebar-brand-full">
          Vouch
        </Link>
      }
      header={
        <>
          <div className="sidebar-notifications sidebar-notifications-inline">
            <NotificationBell />
          </div>
          <p className="label-caps">Actions</p>
        </>
      }
      nav={
        <>
          <SidebarButton icon={<IconAddCrew />} onClick={() => { setShowCreate(true); setShowJoin(false); }}>
            Start a crew
          </SidebarButton>
          <SidebarButton icon={<IconInvite />} onClick={() => { setShowJoin(true); setShowCreate(false); }}>
            Enter invite code
          </SidebarButton>
          <SidebarLink to="/dashboard/discover" icon={<IconInvite />}>
            Discover crews
          </SidebarLink>
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
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Creating…' : 'Create crew'}
          </button>
        </form>
      )}

      {showJoin && (
        <form onSubmit={joinGroup} className="panel-inset mb-10 space-y-4">
          <p className="label-caps">Invite code</p>
          <input placeholder="XXXXXXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required className="input font-mono uppercase tracking-widest" />
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Joining…' : 'Join crew'}
          </button>
        </form>
      )}

      <p className="label-caps">Your crews</p>
      {loading ? (
        <CrewListSkeleton />
      ) : groups.length === 0 ? (
        <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
          No crews yet — start one or grab an invite code from a friend.
        </p>
      ) : (
        <ul className="crew-card-list">
          {groups.map((g) => (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`} className="crew-card">
                <div className="crew-card-main">
                  <h3 className="font-display text-lg font-semibold text-ink">{g.name}</h3>
                  {g.description && <p className="crew-card-desc">{g.description}</p>}
                  <span className="text-xs text-ink-muted capitalize">{g.my_role}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16">
        <InsightsPanel />
      </div>
    </SidebarShell>
  );
}
