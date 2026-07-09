export type LevelInfo = {
  level: number;
  title: string;
  currentXp: number;
  xpInLevel: number;
  xpToNext: number;
  progress: number;
};

const LEVEL_THRESHOLDS = [0, 25, 60, 110, 180, 270, 380, 510, 660, 830, 1020];

const LEVEL_TITLES = [
  'Rookie',
  'Grinder',
  'Regular',
  'Contender',
  'Heavy Hitter',
  'All-Star',
  'MVP',
  'Elite',
  'Legend',
  'Hall of Fame',
  'Untouchable',
];

export function getLevelInfo(points: number): LevelInfo {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    level < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[level]
      : currentThreshold + 200 + (level - LEVEL_THRESHOLDS.length) * 100;

  const xpInLevel = points - currentThreshold;
  const xpToNext = nextThreshold - currentThreshold;
  const progress = xpToNext > 0 ? Math.min(100, (xpInLevel / xpToNext) * 100) : 100;

  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    currentXp: points,
    xpInLevel,
    xpToNext,
    progress,
  };
}

export function getStandingsTitle(rank: number | null, total: number): string {
  if (!rank || total === 0) return 'Unranked';
  if (rank === 1) return 'Crew Captain';
  if (rank === 2) return 'First Mate';
  if (rank === 3) return 'On the Podium';
  const pct = rank / total;
  if (pct <= 0.25) return 'Top Tier';
  if (pct <= 0.5) return 'Mid Pack';
  return 'Climbing';
}

export type Achievement = {
  id: string;
  label: string;
  emoji: string;
  earned: boolean;
  hint: string;
};

export function getAchievements(
  points: number,
  streak: number,
  rank: number | null
): Achievement[] {
  return [
    {
      id: 'first-blood',
      label: 'First Blood',
      emoji: '🎯',
      earned: points >= 10,
      hint: 'Earn your first 10 pts',
    },
    {
      id: 'on-fire',
      label: 'On Fire',
      emoji: '🔥',
      earned: streak >= 3,
      hint: '3-day streak',
    },
    {
      id: 'week-warrior',
      label: 'Week Warrior',
      emoji: '⚡',
      earned: streak >= 7,
      hint: '7-day streak',
    },
    {
      id: 'iron-will',
      label: 'Iron Will',
      emoji: '💪',
      earned: streak >= 14,
      hint: '14-day streak',
    },
    {
      id: 'century',
      label: 'Century Club',
      emoji: '💯',
      earned: points >= 100,
      hint: '100 pts total',
    },
    {
      id: 'podium',
      label: 'Podium Finish',
      emoji: '🏆',
      earned: rank !== null && rank <= 3,
      hint: 'Top 3 in standings',
    },
  ];
}

export function getStreakLabel(streak: number): string | null {
  if (streak >= 30) return 'Unstoppable';
  if (streak >= 14) return 'Iron Will';
  if (streak >= 7) return 'Week Warrior';
  if (streak >= 3) return 'On Fire';
  return null;
}
