import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type LeaderboardEntry } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { Podium } from '../components/gamification/Podium';

export function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api<LeaderboardEntry[]>(`/groups/${id}/leaderboard`)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const myEntry = entries.find((e) => e.user_id === user?.id);

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
        <p className="mt-8 text-sm text-ink-muted">Loading standings…</p>
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
