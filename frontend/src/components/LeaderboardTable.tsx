import type { LeaderboardEntry } from '../lib/api';

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) {
    return <p className="text-sm text-ink-muted">No members on the board yet.</p>;
  }

  return (
    <ol className="divide-y divide-rule">
      {entries.map((entry) => (
        <li
          key={entry.user_id}
          className={`flex items-center gap-6 py-5 ${entry.rank <= 3 ? 'rank-lead' : ''}`}
        >
          <span className="w-10 font-display text-2xl font-bold text-ink">
            {entry.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">
              {(entry.profile as { name: string })?.name ?? 'Member'}
            </p>
            <p className="text-xs text-ink-muted">{entry.role === 'owner' ? 'Owner' : 'Member'}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-medium text-accent">{entry.points}</p>
            <p className="text-xs text-ink-muted">pts</p>
            {entry.current_streak > 0 && (
              <p className="mt-1 text-xs text-streak">{entry.current_streak}d streak</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
