import type { LeaderboardEntry } from '../../lib/api';
import { StreakFlame } from './StreakFlame';

type Props = { entries: LeaderboardEntry[]; currentUserId?: string };

export function Podium({ entries, currentUserId }: Props) {
  const top3 = entries.filter((e) => e.rank <= 3);
  if (top3.length < 2) return null;

  const order = [top3.find((e) => e.rank === 2), top3.find((e) => e.rank === 1), top3.find((e) => e.rank === 3)].filter(
    Boolean
  ) as LeaderboardEntry[];

  const heights = ['podium-2nd', 'podium-1st', 'podium-3rd'];

  return (
    <div className="podium">
      {order.map((entry, i) => {
        const name = entry.profile?.name ?? 'Member';
        const isMe = entry.user_id === currentUserId;
        return (
          <div key={entry.user_id} className={`podium-slot ${heights[i]}${isMe ? ' podium-slot-me' : ''}`}>
            <div className="podium-avatar">{name.charAt(0).toUpperCase()}</div>
            <p className="podium-name">{name}{isMe ? ' (you)' : ''}</p>
            <p className="podium-points">{entry.points} pts</p>
            {entry.current_streak > 0 && <StreakFlame streak={entry.current_streak} size="sm" />}
          </div>
        );
      })}
    </div>
  );
}
