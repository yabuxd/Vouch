type Props = {
  progress: number;
  xpInLevel: number;
  xpToNext: number;
  compact?: boolean;
};

export function XpBar({ progress, xpInLevel, xpToNext, compact }: Props) {
  return (
    <div className={compact ? 'xp-bar xp-bar-compact' : 'xp-bar'}>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      {!compact && (
        <p className="xp-bar-label">
          <span>{xpInLevel} XP</span>
          <span>{xpToNext - xpInLevel} to level up</span>
        </p>
      )}
    </div>
  );
}
