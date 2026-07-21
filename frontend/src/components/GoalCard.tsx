import type { GoalAssignment } from '../lib/api';
import { Link, useParams } from 'react-router-dom';

const statusBadge: Record<string, string> = {
  pending: 'badge-pending',
  submitted: 'badge-submitted',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  failed: 'badge-rejected',
};

const statusLabel: Record<string, string> = {
  pending: 'Ready',
  submitted: 'Awaiting vouch',
  approved: 'Cleared',
  rejected: 'Rejected — resubmit once',
  failed: 'Failed',
};

export function GoalCard({ assignment }: { assignment: GoalAssignment }) {
  const { id } = useParams();
  const goal = assignment.goals;
  if (!goal) return null;

  const isActionable = ['pending', 'rejected'].includes(assignment.status);

  return (
    <div className={`quest-card${isActionable ? ' quest-card-active' : ''}`}>
      <div className="quest-card-body">
        <div className="quest-card-top">
          <h3 className="font-display text-lg font-semibold text-ink">{goal.title}</h3>
        </div>
        {goal.description && <p className="mt-1 text-sm text-ink-muted">{goal.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`badge ${goal.type === 'group' ? 'badge-group' : 'badge-personal'}`}>
            {goal.type === 'group' ? 'Crew quest' : 'Solo quest'}
          </span>
          <span className="quest-frequency">{goal.frequency}</span>
          <span className={`badge ${statusBadge[assignment.status] ?? ''}`}>
            {statusLabel[assignment.status] ?? assignment.status}
          </span>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-muted">Due {assignment.due_date}</p>
      </div>
      {isActionable && (
        <Link to={`/groups/${id}/submit?assignment=${assignment.id}`} className="btn btn-accent shrink-0">
          Send proof
        </Link>
      )}
    </div>
  );
}
