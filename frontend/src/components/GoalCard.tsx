import type { GoalAssignment } from '../lib/api';
import { Link, useParams } from 'react-router-dom';

const statusBadge: Record<string, string> = {
  pending: 'badge-pending',
  submitted: 'badge-submitted',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

export function GoalCard({ assignment }: { assignment: GoalAssignment }) {
  const { id } = useParams();
  const goal = assignment.goals;
  if (!goal) return null;

  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold text-ink">{goal.title}</h3>
        {goal.description && <p className="mt-1 text-sm text-ink-muted">{goal.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`badge ${goal.type === 'group' ? 'badge-group' : 'badge-personal'}`}>
            {goal.type === 'group' ? 'Group' : 'Personal'}
          </span>
          <span className="text-xs text-ink-muted">{goal.frequency} · {goal.points_value} pts</span>
          <span className={`badge ${statusBadge[assignment.status] ?? ''}`}>{assignment.status}</span>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-muted">Due {assignment.due_date}</p>
      </div>
      {['pending', 'rejected'].includes(assignment.status) && (
        <Link to={`/groups/${id}/submit?assignment=${assignment.id}`} className="btn btn-accent shrink-0">
          Send proof
        </Link>
      )}
    </div>
  );
}
