type Props = { rank: number; size?: 'sm' | 'lg' };

export function RankMedal({ rank, size = 'sm' }: Props) {
  if (rank > 3) {
    return <span className={`rank-num rank-num-${size}`}>{rank}</span>;
  }

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <span className={`rank-medal rank-medal-${size}`} aria-label={`Rank ${rank}`}>
      {medals[rank]}
    </span>
  );
}
