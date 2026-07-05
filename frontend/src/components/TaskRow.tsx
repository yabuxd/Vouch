import { Link, useParams } from 'react-router-dom';
import type { Goal, GoalAssignment } from '../lib/api';

const statusBadge: Record<string, string> = {
  pending: 'badge-pending',
  submitted: 'badge-submitted',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

type Props = { goal: Goal; assignment?: GoalAssignment };

export function TaskRow({ goal, assignment }: Props) {
  const { id } = useParams();

  return (
    <div className="flex items-start justify-between gap-6 border-b border-rule py-5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-ink">{goal.title}</h3>
          <span className={`badge ${goal.type === 'group' ? 'badge-group' : 'badge-personal'}`}>
            {goal.type === 'group' ? 'Group' : 'Personal'}
          </span>
        </div>
        {goal.description && <p className="mt-1 text-sm text-ink-muted">{goal.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span>{goal.frequency}</span>
          <span>·</span>
          <span>{goal.points_value} pts</span>
          {assignment && (
            <>
              <span>·</span>
              <span className={`badge ${statusBadge[assignment.status] ?? ''}`}>{assignment.status}</span>
              <span>· Due {assignment.due_date}</span>
            </>
          )}
        </div>
      </div>
      {assignment && ['pending', 'rejected'].includes(assignment.status) && (
        <Link to={`/groups/${id}/submit?assignment=${assignment.id}`} className="btn btn-accent shrink-0">
          Send proof
        </Link>
      )}
    </div>
  );
}
