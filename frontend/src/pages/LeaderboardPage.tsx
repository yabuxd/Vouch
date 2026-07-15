import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type LeaderboardEntry } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { Podium } from '../components/gamification/Podium';
import { LeaderboardSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';

export function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api<LeaderboardEntry[]>(`/groups/${id}/leaderboard`)
      .then(setEntries)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const myEntry = entries.find((e) => e.user_id === user?.id);

  if (error) return <ErrorState error={error} onRetry={load} homeLink={false} />;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Standings</h2>
          <p className="section-sub">Vouched points decide who runs this crew.</p>
        </div>
        <button onClick={load} className="btn btn-ghost">Refresh</button>
      </div>

      {myEntry && (
        <div className="my-standing-banner">
          <span>Your spot:</span>
          <strong>#{myEntry.rank}</strong>
          <span className="text-ink-muted">·</span>
          <span className="font-mono text-accent">{myEntry.points} pts</span>
          {myEntry.current_streak > 0 && (
            <>
              <span className="text-ink-muted">·</span>
              <span className="text-streak">🔥 {myEntry.current_streak}d</span>
            </>
          )}
        </div>
      )}

      {loading ? (
        <LeaderboardSkeleton />
      ) : (
        <>
          <Podium entries={entries} currentUserId={user?.id} />
          <div className="mt-8">
            <LeaderboardTable entries={entries} currentUserId={user?.id} />
          </div>
        </>
      )}
    </div>
  );
}
