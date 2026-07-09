import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, apiUpload, type GroupDashboard } from '../lib/api';
import { PointsReward } from '../components/gamification/PointsReward';

export function SubmissionUploadPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<GroupDashboard['pending_assignments']>([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('assignment') ?? '');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (id) {
      api<GroupDashboard>(`/groups/${id}/dashboard`).then((d) => {
        const pending = d.pending_assignments.filter(
          (a) => a.status === 'pending' || a.status === 'rejected'
        );
        setAssignments(pending);
        if (!selectedId && pending.length) setSelectedId(pending[0].id);
      });
    }
  }, [id, selectedId]);

  const selected = assignments.find((a) => a.id === selectedId);
  const rewardPoints = selected?.goals?.points_value ?? 0;

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedId) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      if (note) formData.append('note', note);
      await apiUpload(`/assignments/${selectedId}/submit`, formData);
      navigate(`/groups/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-2xl font-bold text-ink">Send proof</h2>
      <p className="section-sub">Snap it. Your crew vouches before the points land.</p>

      {rewardPoints > 0 && (
        <div className="reward-preview">
          <span className="label-caps">Reward</span>
          <PointsReward points={rewardPoints} size="lg" pulse />
          <p className="text-xs text-ink-muted">Awarded when your crew vouches</p>
        </div>
      )}

      {error && <p className="alert-error mt-6">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="label-caps">Quest</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="select">
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.goals?.title} — {a.goals?.points_value} pts — due {a.due_date}
              </option>
            ))}
          </select>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`drop-zone ${dragOver ? 'drop-zone-active' : ''}`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="mx-auto max-h-56" />
          ) : (
            <div className="drop-zone-prompt">
              <span className="drop-zone-icon">📸</span>
              <p className="text-sm text-ink-muted">Drop your screenshot here, or choose a file</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="mt-4 text-sm" />
        </div>

        <div>
          <label className="label-caps">Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you actually do?" className="textarea" rows={2} />
        </div>

        <button type="submit" disabled={loading || !file || !selectedId} className="btn btn-primary btn-full">
          {loading ? 'Uploading…' : `Submit for vouching (+${rewardPoints} pts)`}
        </button>
      </form>
    </div>
  );
}
