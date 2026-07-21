import { useEffect, useState, useCallback } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, type Group, type GroupDashboard } from '../lib/api';
import { GoalCard } from '../components/GoalCard';
import { InviteCodeBanner } from '../components/InviteCodeBanner';
import { ErrorState } from '../components/ErrorState';

export function GroupDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [error, setError] = useState<unknown>(null);

  const loadDashboard = useCallback(() => {
    if (!id) return;
    setError(null);
    api<GroupDashboard>(`/groups/${id}/dashboard`)
      .then(setDashboard)
      .catch((err) => setError(err));
  }, [id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (error) {
    return <ErrorState error={error} onRetry={loadDashboard} homeLink={false} />;
  }

  const memberCount = group?.members?.length ?? 0;

  return (
    <div className="space-y-12">
      <div className="crew-overview-header">
        <h2 className="font-display text-2xl font-bold text-ink">Overview</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {memberCount} member{memberCount === 1 ? '' : 's'} in this crew.
        </p>
      </div>

      {(dashboard?.pending_approvals_count ?? 0) > 0 && (
        <Link to={`/groups/${id}/approve`} className="quest-alert block">
          <span className="quest-alert-icon">⚡</span>
          <span>
            <strong>{dashboard?.pending_approvals_count} proof{dashboard?.pending_approvals_count === 1 ? '' : 's'}</strong>
            {' '}waiting for your vouch →
          </span>
        </Link>
      )}

      {group && <InviteCodeBanner group={group} />}

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Active quests</p>
            <p className="section-sub">What you need to complete next.</p>
          </div>
          <Link to={`/groups/${id}/tasks`} className="btn btn-ghost">
            All tasks
          </Link>
        </div>

        {dashboard?.pending_assignments?.length ? (
          <div className="quest-list">
            {dashboard.pending_assignments.map((a) => (
              <GoalCard key={a.id} assignment={a} />
            ))}
          </div>
        ) : (
          <div className="empty-quest">
            <p className="empty-quest-icon">◎</p>
            <p className="text-sm text-ink-muted">
              No active quests.{' '}
              <Link to={`/groups/${id}/tasks`} className="link">View all tasks</Link> to get started.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
