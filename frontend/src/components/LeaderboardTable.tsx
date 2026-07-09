import type { LeaderboardEntry } from '../lib/api';
import { getLevelInfo } from '../lib/gamification';
import { RankMedal } from './gamification/RankMedal';
import { StreakFlame } from './gamification/StreakFlame';
import { LevelBadge } from './gamification/LevelBadge';

export function LeaderboardTable({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}) {
  if (!entries.length) {
    return <p className="text-sm text-ink-muted">No one on the board yet. Be first.</p>;
  }

  return (
    <ol className="standings-table">
      {entries.map((entry) => {
        const isMe = entry.user_id === currentUserId;
        const level = getLevelInfo(entry.points);
        const name = entry.profile?.name ?? 'Member';

        return (
          <li
            key={entry.user_id}
            className={`standings-row${entry.rank <= 3 ? ' standings-row-top' : ''}${isMe ? ' standings-row-me' : ''}`}
          >
            <RankMedal rank={entry.rank} />
            <div className="standings-avatar" aria-hidden>
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="standings-info">
              <p className="standings-name">
                {name}
                {isMe && <span className="standings-you">you</span>}
              </p>
              <div className="standings-meta">
                <LevelBadge level={level.level} size="sm" />
                <span className="text-xs text-ink-muted">{entry.role === 'owner' ? 'Owner' : 'Member'}</span>
              </div>
            </div>
            <div className="standings-score">
              <p className="font-mono text-lg font-medium text-accent">{entry.points}</p>
              <p className="text-xs text-ink-muted">pts</p>
              {entry.current_streak > 0 && <StreakFlame streak={entry.current_streak} size="sm" />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
