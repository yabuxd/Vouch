import type { Submission } from '../lib/api';
import { PointsReward } from './gamification/PointsReward';
import { VouchProgress } from './gamification/VouchProgress';
import { SubmissionComments } from './SubmissionComments';
import { FlagContentButton } from './FlagContentButton';

type Props = {
  submission: Submission;
  onVote?: (id: string, decision: 'approve' | 'reject') => void;
  voting?: boolean;
  showComments?: boolean;
};

export function SubmissionCard({ submission, onVote, voting, showComments = true }: Props) {
  const points = submission.goal_assignments?.goals?.points_value ?? 0;
  const approvals = submission.approval_count ?? 0;
  const rejections = submission.rejection_count ?? 0;
  const threshold = submission.approval_threshold ?? 2;

  return (
    <article className="vouch-card">
      {submission.screenshot_signed_url && (
        <div className="vouch-card-proof">
          <img
            src={submission.screenshot_signed_url}
            alt="Proof submitted"
            className="vouch-card-img"
          />
          <div className="vouch-card-reward">
            <PointsReward points={points} size="lg" pulse />
            <p className="text-xs text-ink-muted">on the line</p>
          </div>
        </div>
      )}
      <div className="vouch-card-body">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-display text-lg font-semibold text-ink">
            {submission.profiles?.name ?? 'Member'}
          </p>
          <div className="flex items-center gap-2">
            <FlagContentButton targetType="submission" targetId={submission.id} />
            <time className="font-mono text-xs text-ink-muted">
              {new Date(submission.submitted_at).toLocaleDateString()}
            </time>
          </div>
        </div>
        <p className="mt-1 text-sm text-accent">{submission.goal_assignments?.goals?.title}</p>
        {submission.note && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{submission.note}</p>}

        {submission.status === 'pending' && (
          <VouchProgress approvals={approvals} rejections={rejections} threshold={threshold} />
        )}

        {submission.status !== 'pending' && (
          <p className={`mt-3 text-sm ${submission.status === 'approved' ? 'text-success' : 'text-ink-muted'}`}>
            {submission.status === 'approved' ? 'Approved' : 'Rejected'}
          </p>
        )}

        {onVote && !submission.already_voted && submission.status === 'pending' && (
          <div className="mt-6 flex gap-3">
            <button onClick={() => onVote(submission.id, 'approve')} disabled={voting} className="btn btn-success flex-1">
              ✓ Vouch
            </button>
            <button onClick={() => onVote(submission.id, 'reject')} disabled={voting} className="btn btn-reject flex-1">
              ✕ Reject
            </button>
          </div>
        )}
        {onVote && submission.already_voted && submission.status === 'pending' && (
          <p className="mt-4 text-sm text-ink-muted">You already weighed in. Waiting on the crew.</p>
        )}

        {showComments && <SubmissionComments submissionId={submission.id} />}
      </div>
    </article>
  );
}
