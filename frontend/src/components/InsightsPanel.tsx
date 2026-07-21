import { useEffect, useState } from 'react';
import { api, type UserInsights } from '../lib/api';
import { ErrorState } from './ErrorState';

export function InsightsPanel() {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api<UserInsights>('/users/me/insights')
      .then(setInsights)
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading your insights…</p>;
  }

  if (error) {
    return <ErrorState error={error} onRetry={load} homeLink={false} />;
  }

  if (!insights) return null;

  const maxMissRate = Math.max(...insights.day_of_week.map((d) => d.miss_rate), 1);

  return (
    <section className="insights-panel">
      <div className="section-header section-header-flush">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Your patterns</h2>
          <p className="section-sub">Private reflection — only you see this.</p>
        </div>
      </div>

      <div className="insights-rates">
        <div className="insights-rate-card">
          <p className="label-caps">Last 30 days</p>
          <p className="insights-rate-value">{insights.completion_rate_30d}%</p>
          <p className="text-xs text-ink-muted">completion rate</p>
        </div>
        <div className="insights-rate-card">
          <p className="label-caps">Last 90 days</p>
          <p className="insights-rate-value">{insights.completion_rate_90d}%</p>
          <p className="text-xs text-ink-muted">completion rate</p>
        </div>
      </div>

      <div className="insights-section">
        <p className="label-caps">Misses by day of week</p>
        <div className="insights-bar-chart">
          {insights.day_of_week.map((d) => (
            <div key={d.day} className="insights-bar-col">
              <div
                className="insights-bar"
                style={{ height: `${Math.max(8, (d.miss_rate / maxMissRate) * 100)}%` }}
                title={`${d.missed} missed of ${d.total}`}
              />
              <span className="insights-bar-label">{d.day.slice(0, 3)}</span>
              {d.total > 0 && (
                <span className="insights-bar-meta">{d.miss_rate}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="insights-section">
        <p className="label-caps">Quest stickiness</p>
        {insights.per_quest.length === 0 ? (
          <p className="text-sm text-ink-muted">Complete a few quests to see trends here.</p>
        ) : (
          <ul className="insights-quest-list">
            {insights.per_quest.map((q) => (
              <li key={q.title} className="insights-quest-row">
                <span className="insights-quest-title">{q.title}</span>
                <span className="insights-quest-rate">{q.completion_rate}%</span>
                <span className="text-xs text-ink-muted">{q.completed}/{q.total}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
