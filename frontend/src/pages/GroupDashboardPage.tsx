import { useEffect, useState, useCallback } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, type Group, type GroupDashboard, type MissedFeed, type ActivityHeatmap, type WeeklyAnalysis } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { GoalCard } from '../components/GoalCard';
import { InviteCodeBanner } from '../components/InviteCodeBanner';
import { PlayerStatsPanel } from '../components/gamification/PlayerStatsPanel';
import { ActivityHeatMap } from '../components/gamification/ActivityHeatMap';
import { WeeklyAnalysis as WeeklyAnalysisPanel } from '../components/gamification/WeeklyAnalysis';
import { MissedEventCard } from '../components/gamification/MissedEventCard';
import { MissedFeedSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';

export function GroupDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [activity, setActivity] = useState<ActivityHeatmap | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyAnalysis | null>(null);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
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

  const loadActivity = useCallback(() => {
    if (!id) return;
    setLoadingActivity(true);
    api<ActivityHeatmap>(`/groups/${id}/activity-heatmap`)
      .then(setActivity)
      .catch((err) => console.error(toUserErrorMessage(err)))
      .finally(() => setLoadingActivity(false));
  }, [id]);

  const loadWeeklyAnalysis = useCallback(() => {
    if (!id) return;
    setLoadingWeekly(true);
    api<WeeklyAnalysis>(`/groups/${id}/weekly-analysis`)
      .then(setWeeklyAnalysis)
      .catch((err) => console.error(toUserErrorMessage(err)))
      .finally(() => setLoadingWeekly(false));
  }, [id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    loadWeeklyAnalysis();
  }, [loadWeeklyAnalysis]);

  useEffect(() => {
    loadMissed();
  }, [loadMissed]);

  if (error) {
    return <ErrorState error={error} onRetry={loadDashboard} homeLink={false} />;
  }

  const memberCount = group?.members?.length ?? 0;

  return (
    <div className="space-y-12">
      <PlayerStatsPanel
        rank={dashboard?.my_rank ?? null}
        points={dashboard?.my_points ?? 0}
        streak={dashboard?.my_streak ?? 0}
        memberCount={memberCount}
      />

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Activity</p>
            <p className="section-sub">Vouches earned over the last 12 weeks.</p>
          </div>
        </div>
        <ActivityHeatMap days={activity?.days ?? {}} loading={loadingActivity} />
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Weekly analysis</p>
            <p className="section-sub">How this week stacks up against last.</p>
          </div>
        </div>
        <WeeklyAnalysisPanel data={weeklyAnalysis} loading={loadingWeekly} />
      </section>

      {(dashboard?.pending_approvals_count ?? 0) > 0 && (
        <Link to={`/groups/${id}/approve`} className="quest-alert block">
          <span className="quest-alert-icon">⚡</span>
          <span>
            <strong>{dashboard?.pending_approvals_count} proof{dashboard?.pending_approvals_count === 1 ? '' : 's'}</strong>
            {' '}waiting for your vouch — earn crew karma →
          </span>
        </Link>
      )}

      {group && <InviteCodeBanner group={group} />}

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Active quests</p>
            <p className="section-sub">Complete these to rack up points.</p>
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
              <Link to={`/groups/${id}/tasks`} className="link">Pick up a task</Link> to start earning.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Missed quests</p>
            <p className="section-sub">Crew misses happen — react and rally.</p>
          </div>
          <button type="button" onClick={loadMissed} className="btn btn-ghost">
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
            <p className="text-sm text-ink-muted">No missed quests lately — the crew&apos;s on fire.</p>
          </div>
        )}
      </section>
    </div>
  );
}
