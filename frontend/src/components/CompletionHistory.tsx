import { Link } from 'react-router-dom';
import type { CompletionHistoryItem } from '../lib/api';
import { formatDueDate } from '../lib/format';
import { IconShieldCheck } from './SidebarIcons';

const statusBadge: Record<string, string> = {
  pending: 'badge-submitted',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

type Props = {
  items: CompletionHistoryItem[];
  groupId?: string;
};

export function CompletionHistory({ items, groupId }: Props) {
  if (!items.length) {
    return (
      <div className="history-empty">
        <IconShieldCheck className="history-empty-icon" />
        <p className="history-empty-title">No proof submitted yet</p>
        <p className="history-empty-body">
          Send proof on your first quest to start your streak.
          {groupId && (
            <>
              {' '}
              <Link to={`/groups/${groupId}/tasks`} className="link">
                Pick a quest
              </Link>
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="quest-card quest-card-row">
          <div className="quest-card-body flex-1">
            <div className="quest-card-top">
              <h3 className="font-display text-lg font-semibold text-ink">{item.assignment_title}</h3>
              <span className={`badge ${statusBadge[item.status] ?? ''}`}>
                {statusLabel[item.status] ?? item.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-ink-muted">
              {formatDueDate(item.due_date)} · Submitted{' '}
              {new Date(item.submitted_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {item.note && <p className="mt-2 text-sm text-ink-muted">{item.note}</p>}
          </div>
          {item.screenshot_signed_url && (
            <a
              href={item.screenshot_signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <img
                src={item.screenshot_signed_url}
                alt="Submitted proof"
                className="h-20 w-20 rounded-lg object-cover border border-rule"
              />
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
