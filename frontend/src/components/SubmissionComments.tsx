import { useCallback, useEffect, useState } from 'react';
import { api, type SubmissionComment } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { FlagContentButton } from './FlagContentButton';

type Props = {
  submissionId: string;
};

export function SubmissionComments({ submissionId }: Props) {
  const [comments, setComments] = useState<SubmissionComment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api<SubmissionComment[]>(`/submissions/${submissionId}/comments`)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [submissionId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const comment = await api<SubmissionComment>(`/submissions/${submissionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      });
      setComments((prev) => [...prev, comment]);
      setBody('');
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="submission-comments">
      {loading ? (
        <p className="text-xs text-ink-muted">Loading comments…</p>
      ) : comments.length > 0 ? (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-item-head">
                <strong>{c.profiles?.name ?? 'Member'}</strong>
                <time className="comment-item-time">
                  {new Date(c.created_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
                <FlagContentButton targetType="comment" targetId={c.id} />
              </div>
              <p className="comment-item-body">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={submit} className="comment-form">
        {error && <p className="alert-error text-xs">{error}</p>}
        <div className="comment-form-row">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="input comment-input"
          />
          <button type="submit" disabled={submitting || !body.trim()} className="btn btn-ghost comment-submit">
            {submitting ? '…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
