type Props = { level: number; title?: string; size?: 'sm' | 'md' | 'lg' };

export function LevelBadge({ level, title, size = 'md' }: Props) {
  return (
    <div className={`level-badge level-badge-${size}`}>
      <span className="level-badge-num">{level}</span>
      {title && <span className="level-badge-title">{title}</span>}
    </div>
  );
}
