import type { GoalAssignment } from '../lib/api';
import { Link, useParams } from 'react-router-dom';
import {
  formatDueDate,
  formatFrequency,
  polishGoalDescription,
  polishGoalTitle,
} from '../lib/format';
import { IconClock, IconProof } from './SidebarIcons';

const statusBadge: Record<string, string> = {
  pending: 'badge-ready',
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
  const isGroup = goal.type === 'group';

  return (
    <div className={`quest-card${isActionable ? ' quest-card-urgent' : ''}`}>
      <div className="quest-card-body">
        <div className="quest-card-top">
          <h3 className="font-display text-lg font-semibold text-ink">
            {polishGoalTitle(goal.title)}
          </h3>
        </div>
        {goal.description && (
          <p className="mt-1 text-sm text-ink-muted">{polishGoalDescription(goal.description)}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`badge ${isGroup ? 'badge-crew' : 'badge-personal'}`}>
            {isGroup ? 'Crew quest' : 'Solo quest'}
          </span>
          <span className="badge badge-frequency">{formatFrequency(goal.frequency)}</span>
          <span className={`badge ${statusBadge[assignment.status] ?? ''}`}>
            {statusLabel[assignment.status] ?? assignment.status}
          </span>
        </div>
        <p className="quest-due-date mt-2">
          <IconClock className="quest-due-icon" />
          <span>{formatDueDate(assignment.due_date)}</span>
        </p>
      </div>
      {isActionable && (
        <Link
          to={`/groups/${id}/submit?assignment=${assignment.id}`}
          className="btn btn-accent btn-primary-action shrink-0"
        >
          <IconProof className="btn-leading-icon" />
          Send proof
        </Link>
      )}
    </div>
  );
}
