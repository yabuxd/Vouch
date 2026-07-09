import { Link, useParams } from 'react-router-dom';
import type { Goal, GoalAssignment } from '../lib/api';
import { PointsReward } from './gamification/PointsReward';

const statusBadge: Record<string, string> = {
  pending: 'badge-pending',
  submitted: 'badge-submitted',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

const statusLabel: Record<string, string> = {
  pending: 'Ready',
  submitted: 'Awaiting vouch',
  approved: 'Cleared',
  rejected: 'Bounced',
};

type Props = { goal: Goal; assignment?: GoalAssignment };

export function TaskRow({ goal, assignment }: Props) {
  const { id } = useParams();
  const isActionable = assignment && ['pending', 'rejected'].includes(assignment.status);

  return (
    <div className={`quest-card quest-card-row${isActionable ? ' quest-card-active' : ''}`}>
      <div className="quest-card-body">
        <div className="quest-card-top">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-ink">{goal.title}</h3>
            <span className={`badge ${goal.type === 'group' ? 'badge-group' : 'badge-personal'}`}>
              {goal.type === 'group' ? 'Crew' : 'Solo'}
            </span>
          </div>
          <PointsReward points={goal.points_value} size="sm" pulse={!!isActionable} />
        </div>
        {goal.description && <p className="mt-1 text-sm text-ink-muted">{goal.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="quest-frequency">{goal.frequency}</span>
          {assignment && (
            <>
              <span>·</span>
              <span className={`badge ${statusBadge[assignment.status] ?? ''}`}>
                {statusLabel[assignment.status] ?? assignment.status}
              </span>
              <span>· Due {assignment.due_date}</span>
            </>
          )}
        </div>
      </div>
      {isActionable && (
        <Link to={`/groups/${id}/submit?assignment=${assignment.id}`} className="btn btn-accent shrink-0">
          Send proof
        </Link>
      )}
    </div>
  );
}
