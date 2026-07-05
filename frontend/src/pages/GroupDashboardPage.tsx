import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, type Group, type GroupDashboard } from '../lib/api';
import { GoalCard } from '../components/GoalCard';
import { InviteCodeBanner } from '../components/InviteCodeBanner';

export function GroupDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);

  useEffect(() => {
    if (id) api<GroupDashboard>(`/groups/${id}/dashboard`).then(setDashboard).catch(console.error);
  }, [id]);

  return (
    <div className="space-y-12">
      <div className="stat-strip">
        <div className="stat-cell">
          <p className="label-caps">Rank</p>
          <p className="mt-2 font-display text-4xl font-bold text-ink">
            {dashboard?.my_rank ? dashboard.my_rank : '—'}
          </p>
        </div>
        <div className="stat-cell px-6">
          <p className="label-caps">Points</p>
          <p className="mt-2 font-display text-4xl font-bold text-accent">{dashboard?.my_points ?? 0}</p>
        </div>
        <div className="stat-cell pl-6">
          <p className="label-caps">Streak</p>
          <p className="mt-2 font-display text-4xl font-bold text-streak">
            {(dashboard?.my_streak ?? 0) > 0 ? dashboard?.my_streak : '0'}
            <span className="ml-1 font-body text-base font-normal text-ink-muted">days</span>
          </p>
        </div>
      </div>

      {(dashboard?.pending_approvals_count ?? 0) > 0 && (
        <Link to={`/groups/${id}/approve`} className="alert-warn block hover:opacity-90">
          {dashboard?.pending_approvals_count} proof{dashboard?.pending_approvals_count === 1 ? '' : 's'} waiting for your vouch →
        </Link>
      )}

      {group && <InviteCodeBanner group={group} />}

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
          <p className="label-caps">Due now</p>
          <Link to={`/groups/${id}/tasks`} className="btn btn-ghost">
            Manage tasks
          </Link>
        </div>

        {dashboard?.pending_assignments?.length ? (
          <div className="mt-2 divide-y divide-rule">
            {dashboard.pending_assignments.map((a) => (
              <GoalCard key={a.id} assignment={a} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-ink-muted">
            Nothing due right now.{' '}
            <Link to={`/groups/${id}/tasks`} className="link">Add a task</Link> to get moving.
          </p>
        )}
      </section>
    </div>
  );
}
