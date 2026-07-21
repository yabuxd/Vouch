import { useState } from 'react';
import { api, type ReportReason, type ReportTargetType } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

type Props = {
  targetType: ReportTargetType;
  targetId: string;
};

export function FlagContentButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_id: targetId, reason, details }),
      });
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return <span className="flag-btn flag-btn-done" title="Report submitted">Flagged</span>;
  }

  return (
    <div className="flag-wrap">
      <button
        type="button"
        className="flag-btn"
        aria-label="Report content"
        title="Report"
        onClick={() => setOpen((v) => !v)}
      >
        ⚑
      </button>
      {open && (
        <form className="flag-panel" onSubmit={submit}>
          <p className="label-caps">Report</p>
          <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)} className="input">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Optional details"
            rows={2}
            className="textarea"
          />
          {error && <p className="alert-error text-xs">{error}</p>}
          <div className="flag-panel-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
