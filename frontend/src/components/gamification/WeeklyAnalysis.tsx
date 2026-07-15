import { StreakFlame } from './StreakFlame';

export type WeeklyAnalysisData = {
  this_week: { points: number; completions: number };
  last_week: { points: number; completions: number };
  streak: number;
  points_change_pct: number | null;
  completions_change: number;
  best_day: { date: string; label: string; count: number } | null;
  insights: string[];
};

type Props = {
  data: WeeklyAnalysisData | null;
  loading?: boolean;
};

function formatDelta(value: number, suffix = ''): string {
  if (value > 0) return `+${value}${suffix}`;
  if (value < 0) return `${value}${suffix}`;
  return '—';
}

function WeeklyAnalysisSkeleton() {
  return (
    <div className="weekly-analysis" aria-busy="true" aria-label="Loading weekly analysis">
      <div className="weekly-analysis-stats" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="weekly-stat">
            <span className="weekly-stat-label-skeleton heat-map-shimmer" />
            <span className="weekly-stat-value-skeleton heat-map-shimmer" />
            <span className="weekly-stat-sub-skeleton heat-map-shimmer" />
          </div>
        ))}
      </div>
      <ul className="weekly-insights weekly-insights-skeleton" aria-hidden>
        {Array.from({ length: 2 }, (_, i) => (
          <li key={i}>
            <span className="weekly-insight-skeleton heat-map-shimmer" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WeeklyAnalysis({ data, loading = false }: Props) {
  if (loading || !data) {
    return <WeeklyAnalysisSkeleton />;
  }

  const { this_week, last_week, streak, points_change_pct, completions_change, insights } = data;

  return (
    <div className="weekly-analysis">
      <div className="weekly-analysis-stats">
        <div className="weekly-stat">
          <p className="label-caps">Points</p>
          <p className="weekly-stat-value text-accent">{this_week.points}</p>
          <p className="weekly-stat-sub">
            vs {last_week.points} last week
            {points_change_pct !== null && (
              <span className={points_change_pct >= 0 ? 'weekly-delta-up' : 'weekly-delta-down'}>
                {' '}
                ({formatDelta(points_change_pct, '%')})
              </span>
            )}
          </p>
        </div>
        <div className="weekly-stat">
          <p className="label-caps">Vouches</p>
          <p className="weekly-stat-value">{this_week.completions}</p>
          <p className="weekly-stat-sub">
            vs {last_week.completions} last week
            {completions_change !== 0 && (
              <span className={completions_change >= 0 ? 'weekly-delta-up' : 'weekly-delta-down'}>
                {' '}
                ({formatDelta(completions_change)})
              </span>
            )}
          </p>
        </div>
        <div className="weekly-stat">
          <p className="label-caps">Streak</p>
          <div className="weekly-stat-value">
            {streak > 0 ? <StreakFlame streak={streak} size="lg" /> : <span className="text-ink-muted">0</span>}
          </div>
          <p className="weekly-stat-sub">{streak > 0 ? 'Keep it going' : 'Start with a daily quest'}</p>
        </div>
      </div>

      {insights.length > 0 && (
        <ul className="weekly-insights">
          {insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
