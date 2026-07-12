import { Outlet, useParams, Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { api, type Group } from '../lib/api';
import { ApiError, toUserErrorMessage } from '../lib/errors';
import { useAuth } from '../hooks/useAuth';
import { SidebarShell } from './SidebarShell';
import { SidebarLink, SidebarButton } from './SidebarLink';
import { ErrorState } from './ErrorState';
import {
  IconOverview,
  IconTasks,
  IconProof,
  IconVouch,
  IconStandings,
  IconSettings,
  IconSignOut,
} from './SidebarIcons';
import { getLevelInfo } from '../lib/gamification';
import { StreakFlame } from './gamification/StreakFlame';
import { XpBar } from './gamification/XpBar';

const navItems = [
  { to: '', label: 'Overview', icon: <IconOverview />, end: true },
  { to: 'tasks', label: 'Quests', icon: <IconTasks /> },
  { to: 'submit', label: 'Send proof', icon: <IconProof /> },
  { to: 'approve', label: 'Vouch', icon: <IconVouch /> },
  { to: 'leaderboard', label: 'Standings', icon: <IconStandings /> },
  { to: 'settings', label: 'Settings', icon: <IconSettings />, ownerOnly: true },
];

export function GroupLayout() {
  const { id } = useParams<{ id: string }>();
  const { signOut } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api<Group>(`/groups/${id}`)
      .then(setGroup)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-sm text-ink-muted">Loading crew…</p>
      </div>
    );
  }

  if (error || !group) {
    const status = error instanceof ApiError ? error.status : 404;
    return (
      <div className="error-page">
        <ErrorState
          error={error ?? new ApiError(toUserErrorMessage(error) || 'Crew not found.', status)}
          onRetry={status === 404 || status === 403 ? undefined : load}
        />
      </div>
    );
  }

  const links = navItems.filter(
    (item) => !item.ownerOnly || group.my_role === 'owner'
  );

  const level = getLevelInfo(group.my_points ?? 0);

  return (
    <SidebarShell
      title={group.name}
      brand={
        <Link to="/dashboard" className="sidebar-brand sidebar-brand-full">
          Vouch
        </Link>
      }
      header={
        <>
          <Link to="/dashboard" className="text-xs text-ink-muted hover:text-accent">
            ← All crews
          </Link>
          <p className="mt-3 font-display text-lg font-semibold leading-tight text-ink">
            {group.name}
          </p>
          <div className="sidebar-player-card">
            <div className="sidebar-player-top">
              <span className="sidebar-player-level">Lv.{level.level}</span>
              <span className="font-mono text-sm text-accent">{group.my_points ?? 0} pts</span>
            </div>
            {(group.my_streak ?? 0) > 0 && <StreakFlame streak={group.my_streak!} size="sm" />}
            <XpBar
              progress={level.progress}
              xpInLevel={level.xpInLevel}
              xpToNext={level.xpToNext}
              compact
            />
          </div>
          <p className="label-caps mt-4">Navigation</p>
        </>
      }
      nav={
        <>
          {links.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to ? `/groups/${id}/${item.to}` : `/groups/${id}`}
              end={item.end}
              icon={item.icon}
            >
              {item.label}
            </SidebarLink>
          ))}
        </>
      }
      footer={
        <SidebarButton icon={<IconSignOut />} onClick={signOut}>
          Sign out
        </SidebarButton>
      }
    >
      <Outlet context={{ group }} />
    </SidebarShell>
  );
}
