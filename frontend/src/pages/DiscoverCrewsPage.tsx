import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DiscoverableCrew } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { SidebarShell } from '../components/SidebarShell';
import { SidebarButton, SidebarLink } from '../components/SidebarLink';
import { IconAddCrew, IconInvite, IconSignOut } from '../components/SidebarIcons';
import { NotificationBell } from '../components/NotificationBell';
import { CrewListSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['', 'fitness', 'study', 'creative', 'productivity', 'other'];

export function DiscoverCrewsPage() {
  const { signOut } = useAuth();
  const [category, setCategory] = useState('');
  const [crews, setCrews] = useState<DiscoverableCrew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    api<DiscoverableCrew[]>(`/crews/discover${qs}`)
      .then(setCrews)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const requestJoin = async (crewId: string) => {
    setRequesting(crewId);
    setActionError('');
    try {
      await api(`/crews/${crewId}/request-join`, { method: 'POST' });
      setCrews((prev) =>
        prev.map((c) => (c.id === crewId ? { ...c, my_join_request: 'pending' } : c))
      );
    } catch (err) {
      setActionError(toUserErrorMessage(err));
    } finally {
      setRequesting(null);
    }
  };

  return (
    <SidebarShell
      title="Discover crews"
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
          <Link to="/dashboard" className="text-xs text-ink-muted hover:text-accent">
            ← All crews
          </Link>
          <p className="label-caps mt-4">Navigation</p>
        </>
      }
      nav={
        <>
          <SidebarLink to="/dashboard" icon={<IconAddCrew />}>Your crews</SidebarLink>
          <SidebarLink to="/dashboard/discover" end icon={<IconInvite />}>Discover</SidebarLink>
        </>
      }
      footer={
        <SidebarButton icon={<IconSignOut />} onClick={signOut}>
          Sign out
        </SidebarButton>
      }
    >
      <p className="max-w-lg text-sm text-ink-muted">
        Browse open crews and request to join. Invite-code joins are still instant.
      </p>

      <div className="discover-filters mt-8">
        <label className="label-caps">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input discover-select">
          <option value="">All categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {actionError && <p className="alert-error mt-6">{actionError}</p>}

      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : loading ? (
        <CrewListSkeleton />
      ) : crews.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">No discoverable crews in this category yet.</p>
      ) : (
        <ul className="crew-card-list mt-10">
          {crews.map((c) => (
            <li key={c.id} className="discover-card">
              <div className="discover-card-main">
                <h3 className="font-display text-lg font-semibold text-ink">{c.name}</h3>
                {c.description && <p className="crew-card-desc">{c.description}</p>}
                <div className="discover-card-meta">
                  {c.category && <span className="discover-tag">{c.category}</span>}
                  <span className="text-xs text-ink-muted">{c.member_count} members</span>
                </div>
              </div>
              <div className="discover-card-action">
                {c.my_join_request === 'pending' ? (
                  <span className="discover-pending">Request pending</span>
                ) : c.my_join_request === 'denied' ? (
                  <span className="text-xs text-ink-muted">Request denied</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={requesting === c.id}
                    onClick={() => requestJoin(c.id)}
                  >
                    {requesting === c.id ? 'Requesting…' : 'Request to join'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SidebarShell>
  );
}
