import { getAchievements, getLevelInfo, getStandingsTitle } from '../../lib/gamification';
import { AchievementStrip } from './AchievementStrip';
import { LevelBadge } from './LevelBadge';
import { StreakFlame } from './StreakFlame';
import { XpBar } from './XpBar';
import { RankMedal } from './RankMedal';

type Props = {
  rank: number | null;
  points: number;
  streak: number;
  memberCount?: number;
};

export function PlayerStatsPanel({ rank, points, streak, memberCount = 0 }: Props) {
  const level = getLevelInfo(points);
  const standingsTitle = getStandingsTitle(rank, memberCount);
  const achievements = getAchievements(points, streak, rank);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="player-panel">
      <div className="player-panel-header">
        <LevelBadge level={level.level} title={level.title} size="lg" />
        <div className="player-panel-rank">
          {rank ? (
            <>
              <RankMedal rank={rank} size="lg" />
              <div>
                <p className="player-panel-rank-num">#{rank}</p>
                <p className="player-panel-rank-title">{standingsTitle}</p>
              </div>
            </>
          ) : (
            <p className="player-panel-unranked">Not ranked yet</p>
          )}
        </div>
      </div>

      <div className="player-panel-stats">
        <div className="player-stat">
          <p className="label-caps">Points</p>
          <p className="player-stat-value text-accent">{points}</p>
        </div>
        <div className="player-stat">
          <p className="label-caps">Streak</p>
          <div className="player-stat-value">
            {streak > 0 ? <StreakFlame streak={streak} size="lg" /> : <span className="text-ink-muted">0</span>}
          </div>
        </div>
        <div className="player-stat">
          <p className="label-caps">Badges</p>
          <p className="player-stat-value">{earnedCount}<span className="text-ink-muted text-base">/{achievements.length}</span></p>
        </div>
      </div>

      <div className="player-panel-xp">
        <p className="label-caps">Level {level.level} progress</p>
        <XpBar progress={level.progress} xpInLevel={level.xpInLevel} xpToNext={level.xpToNext} />
      </div>

      <AchievementStrip achievements={achievements} />
    </div>
  );
}
