type Props = { points: number; size?: 'sm' | 'md' | 'lg'; pulse?: boolean };

export function PointsReward({ points, size = 'md', pulse }: Props) {
  return (
    <span className={`points-reward points-reward-${size}${pulse ? ' points-reward-pulse' : ''}`}>
      <span className="points-reward-coin" aria-hidden>◎</span>
      +{points} pts
    </span>
  );
}
