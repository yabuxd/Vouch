import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type LeaderboardEntry } from '../lib/api';
import { LeaderboardTable } from '../components/LeaderboardTable';

export function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
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

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Standings</h2>
          <p className="mt-1 text-sm text-ink-muted">Ranked by vouched points.</p>
        </div>
        <button onClick={load} className="btn btn-ghost">Refresh</button>
      </div>
      {loading ? (
        <p className="mt-8 text-sm text-ink-muted">Loading standings…</p>
      ) : (
        <div className="mt-6">
          <LeaderboardTable entries={entries} />
        </div>
      )}
    </div>
  );
}
