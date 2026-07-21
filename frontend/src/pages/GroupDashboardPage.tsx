import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, type Group, type GroupDashboard, type MissedFeed } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { GoalCard } from '../components/GoalCard';
import { InviteCodeBanner } from '../components/InviteCodeBanner';
import { CompletionHistory } from '../components/CompletionHistory';
import { MissedEventCard } from '../components/MissedEventCard';
import { MissedFeedSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';

export function GroupDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [missedFeed, setMissedFeed] = useState<MissedFeed | null>(null);
  const [loadingMissed, setLoadingMissed] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadMissed = useCallback(() => {
    if (!id) return;
    setLoadingMissed(true);
    api<MissedFeed>(`/groups/${id}/missed-feed?limit=10`)
      .then(setMissedFeed)
      .catch((err) => console.error(toUserErrorMessage(err)))
      .finally(() => setLoadingMissed(false));
  }, [id]);

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

  useEffect(() => {
    loadMissed();
  }, [loadMissed]);

  if (error) {
    return <ErrorState error={error} onRetry={loadDashboard} homeLink={false} />;
  }

  return (
    <div className="dashboard-overview">
      {(dashboard?.pending_approvals_count ?? 0) > 0 && (
        <Link to={`/groups/${id}/approve`} className="quest-alert block">
          <span className="quest-alert-icon">⚡</span>
          <span>
            <strong>
              {dashboard?.pending_approvals_count} proof
              {dashboard?.pending_approvals_count === 1 ? '' : 's'}
            </strong>{' '}
            waiting for your vouch →
          </span>
        </Link>
      )}

      {group && <InviteCodeBanner group={group} />}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <p className="label-caps section-eyebrow">Active quests</p>
            <p className="section-sub">Assignments due now — send proof when you&apos;re done.</p>
          </div>
          <Link to={`/groups/${id}/tasks`} className="btn btn-outline-sm">
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
              <Link to={`/groups/${id}/tasks`} className="link">
                Pick up a task
              </Link>{' '}
              to get started.
            </p>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-header section-header-flush">
          <div>
            <p className="label-caps section-eyebrow">Completion history</p>
            <p className="section-sub">Your submitted proof and current status.</p>
          </div>
        </div>
        <CompletionHistory items={dashboard?.completion_history ?? []} groupId={id} />
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <p className="label-caps section-eyebrow">Missed quests</p>
            <p className="section-sub">Crew misses happen — react and rally.</p>
          </div>
          <button type="button" onClick={loadMissed} className="btn btn-outline-sm">
            Refresh
          </button>
        </div>

        {loadingMissed ? (
          <MissedFeedSkeleton />
        ) : missedFeed?.events.length ? (
          <div className="missed-list">
            {missedFeed.events.map((event) => (
              <MissedEventCard
                key={event.id}
                event={event}
                availableEmojis={missedFeed.available_emojis}
                onReactionChange={loadMissed}
              />
            ))}
          </div>
        ) : (
          <div className="empty-quest">
            <p className="empty-quest-icon">✓</p>
            <p className="text-sm text-ink-muted">No missed quests lately — the crew&apos;s on track.</p>
          </div>
        )}
      </section>
    </div>
  );
}
