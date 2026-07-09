type Props = {
  approvals: number;
  rejections: number;
  threshold: number;
};

export function VouchProgress({ approvals, rejections, threshold }: Props) {
  const approvePct = Math.min(100, (approvals / threshold) * 100);
  const rejectPct = Math.min(100, (rejections / threshold) * 100);

  return (
    <div className="vouch-progress">
      <div className="vouch-progress-bars">
        <div className="vouch-progress-track">
          <div className="vouch-progress-approve" style={{ width: `${approvePct}%` }} />
        </div>
        <div className="vouch-progress-track vouch-progress-track-reject">
          <div className="vouch-progress-reject" style={{ width: `${rejectPct}%` }} />
        </div>
      </div>
      <p className="vouch-progress-label">
        <span className="text-success">{approvals}/{threshold} vouches</span>
        <span className="text-ink-muted"> · </span>
        <span className="text-reject">{rejections}/{threshold} rejects</span>
      </p>
    </div>
  );
}
