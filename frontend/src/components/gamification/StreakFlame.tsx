import { getStreakLabel } from '../../lib/gamification';

type Props = { streak: number; size?: 'sm' | 'md' | 'lg' };

export function StreakFlame({ streak, size = 'md' }: Props) {
  if (streak <= 0) return null;

  const label = getStreakLabel(streak);

  return (
    <span className={`streak-flame streak-flame-${size}`}>
      <span className="streak-flame-icon" aria-hidden>🔥</span>
      <span className="streak-flame-count">{streak}</span>
      {label && size !== 'sm' && <span className="streak-flame-label">{label}</span>}
    </span>
  );
}
