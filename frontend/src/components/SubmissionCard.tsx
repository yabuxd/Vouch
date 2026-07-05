import type { Submission } from '../lib/api';

type Props = {
  submission: Submission;
  onVote: (id: string, decision: 'approve' | 'reject') => void;
  voting?: boolean;
};

export function SubmissionCard({ submission, onVote, voting }: Props) {
  return (
    <article className="border-b border-rule pb-10">
      {submission.screenshot_signed_url && (
        <img
          src={submission.screenshot_signed_url}
          alt="Proof submitted"
          className="w-full max-h-80 object-cover bg-surface"
        />
      )}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-display text-lg font-semibold text-ink">
            {submission.profiles?.name ?? 'Member'}
          </p>
          <time className="font-mono text-xs text-ink-muted">
            {new Date(submission.submitted_at).toLocaleDateString()}
          </time>
        </div>
        <p className="mt-1 text-sm text-accent">{submission.goal_assignments?.goals?.title}</p>
        {submission.note && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{submission.note}</p>}

        {!submission.already_voted && submission.status === 'pending' && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => onVote(submission.id, 'approve')} disabled={voting} className="btn btn-success flex-1">
              Vouch
            </button>
            <button onClick={() => onVote(submission.id, 'reject')} disabled={voting} className="btn btn-reject flex-1">
              Reject
            </button>
          </div>
        )}
        {submission.already_voted && (
          <p className="mt-4 text-sm text-ink-muted">You already weighed in on this one.</p>
        )}
      </div>
    </article>
  );
}
