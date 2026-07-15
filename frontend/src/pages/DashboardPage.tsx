import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Group } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { useAuth } from '../hooks/useAuth';
import { SidebarShell } from '../components/SidebarShell';
import { SidebarButton } from '../components/SidebarLink';
import { IconAddCrew, IconInvite, IconSignOut } from '../components/SidebarIcons';
import { CrewListSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';
import { getLevelInfo } from '../lib/gamification';
import { LevelBadge } from '../components/gamification/LevelBadge';
import { StreakFlame } from '../components/gamification/StreakFlame';
import { XpBar } from '../components/gamification/XpBar';

export function DashboardPage() {
  const { signOut } = useAuth();
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

  const totalPoints = groups.reduce((sum, g) => sum + (g.my_points ?? 0), 0);
  const bestStreak = Math.max(0, ...groups.map((g) => g.my_streak ?? 0));
  const globalLevel = getLevelInfo(totalPoints);

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
      {groups.length > 0 && (
        <div className="global-player-card">
          <LevelBadge level={globalLevel.level} title={globalLevel.title} size="md" />
          <div className="global-player-stats">
            <span className="font-mono text-accent font-medium">{totalPoints} pts</span>
            {bestStreak > 0 && <StreakFlame streak={bestStreak} size="sm" />}
          </div>
          <XpBar
            progress={globalLevel.progress}
            xpInLevel={globalLevel.xpInLevel}
            xpToNext={globalLevel.xpToNext}
            compact
          />
        </div>
      )}

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
          {groups.map((g) => {
            const level = getLevelInfo(g.my_points ?? 0);
            return (
              <li key={g.id}>
                <Link to={`/groups/${g.id}`} className="crew-card">
                  <div className="crew-card-main">
                    <h3 className="font-display text-lg font-semibold text-ink">{g.name}</h3>
                    {g.description && <p className="crew-card-desc">{g.description}</p>}
                    <div className="crew-card-meta">
                      <LevelBadge level={level.level} size="sm" />
                      <span className="text-xs text-ink-muted">{g.my_role}</span>
                    </div>
                  </div>
                  <div className="crew-card-score">
                    <p className="font-mono text-lg font-medium text-accent">{g.my_points ?? 0}</p>
                    <p className="text-xs text-ink-muted">pts</p>
                    {(g.my_streak ?? 0) > 0 && <StreakFlame streak={g.my_streak!} size="sm" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SidebarShell>
  );
}
