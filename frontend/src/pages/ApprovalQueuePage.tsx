import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Submission } from '../lib/api';
import { SubmissionCard } from '../components/SubmissionCard';

export function ApprovalQueuePage() {
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

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
      await api(`/submissions/${submissionId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
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
      <h2 className="font-display text-2xl font-bold text-ink">Vouch or reject</h2>
      <p className="mt-2 text-sm text-ink-muted">Their proof only counts if the crew backs it.</p>

      {submissions.length === 0 ? (
        <p className="mt-12 max-w-md text-sm leading-relaxed text-ink-muted">
          Nothing to vouch for right now. Check back when someone submits proof.
        </p>
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
