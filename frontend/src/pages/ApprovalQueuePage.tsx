import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Submission, type VoteResult } from '../lib/api';
import { SubmissionCard } from '../components/SubmissionCard';
import { CelebrationToast } from '../components/gamification/CelebrationToast';

export function ApprovalQueuePage() {
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [celebration, setCelebration] = useState<{ message: string; sub?: string } | null>(null);

  const load = () => {
    if (!id) return;
    api<Submission[]>(`/groups/${id}/submissions/pending`)
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleVote = async (submissionId: string, decision: 'approve' | 'reject') => {
    setVoting(true);
    try {
      const result = await api<VoteResult>(`/submissions/${submissionId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });

      if (result.resolved && result.approved) {
        setCelebration({
          message: `Proof cleared! +${result.points_awarded} pts awarded`,
          sub: result.new_streak ? `🔥 ${result.new_streak}-day streak` : undefined,
        });
      } else if (result.resolved && !result.approved) {
        setCelebration({ message: 'Proof rejected — no points', sub: 'Back to the grind.' });
      } else if (decision === 'approve') {
        setCelebration({
          message: `Vouch counted! ${result.approvals}/${result.threshold}`,
          sub: result.approvals + 1 >= result.threshold ? undefined : 'Almost there…',
        });
      }

      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <p className="text-sm text-ink-muted">Loading queue…</p>;

  return (
    <div>
      {celebration && (
        <CelebrationToast
          message={celebration.message}
          sub={celebration.sub}
          onDone={() => setCelebration(null)}
        />
      )}

      <div className="section-header section-header-flush">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Vouch queue</h2>
          <p className="section-sub">Your crew trusts you to keep it honest.</p>
        </div>
        {submissions.length > 0 && (
          <span className="queue-count">{submissions.length} pending</span>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="empty-quest mt-12">
          <p className="empty-quest-icon">✓</p>
          <p className="max-w-md text-sm leading-relaxed text-ink-muted">
            Queue&apos;s empty. You&apos;re caught up — check back when someone sends proof.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {submissions.map((s) => (
            <SubmissionCard key={s.id} submission={s} onVote={handleVote} voting={voting} />
          ))}
        </div>
      )}
    </div>
  );
}
