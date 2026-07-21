import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Submission, type VoteResult } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { SubmissionCard } from '../components/SubmissionCard';
import { ApprovalQueueSkeleton } from '../components/skeletons/PageSkeletons';
import { ErrorState } from '../components/ErrorState';

export function ApprovalQueuePage() {
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api<Submission[]>(`/groups/${id}/submissions/pending`)
      .then(setSubmissions)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (submissionId: string, decision: 'approve' | 'reject') => {
    setVoting(true);
    setActionError('');
    try {
      const result = await api<VoteResult>(`/submissions/${submissionId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });

      if (result.resolved && result.approved) {
        setToast('Proof approved');
      } else if (result.resolved && result.failed) {
        setToast('Proof rejected — assignment failed');
      } else if (result.resolved && !result.approved) {
        setToast('Proof rejected — one resubmit allowed');
      } else if (decision === 'approve') {
        setToast(`Vouch counted (${result.approvals}/${result.threshold})`);
      }

      load();
    } catch (err) {
      setActionError(toUserErrorMessage(err));
    } finally {
      setVoting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) return <ApprovalQueueSkeleton />;
  if (error) return <ErrorState error={error} onRetry={load} homeLink={false} />;

  return (
    <div>
      {toast && <p className="alert-success mb-6">{toast}</p>}
      {actionError && <p className="alert-error mb-6">{actionError}</p>}

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
