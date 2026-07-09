import type { Achievement } from '../../lib/gamification';

export function AchievementStrip({ achievements }: { achievements: Achievement[] }) {
  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <div className="achievement-strip">
      <p className="label-caps">Badges</p>
      <div className="achievement-row">
        {earned.map((a) => (
          <div key={a.id} className="achievement-badge achievement-earned" title={a.label}>
            <span className="achievement-emoji">{a.emoji}</span>
            <span className="achievement-label">{a.label}</span>
          </div>
        ))}
        {locked.slice(0, Math.max(0, 4 - earned.length)).map((a) => (
          <div key={a.id} className="achievement-badge achievement-locked" title={a.hint}>
            <span className="achievement-emoji">🔒</span>
            <span className="achievement-label">{a.hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
