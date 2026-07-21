import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, type Group } from '../lib/api';

export function GroupSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState(2);
  const [autoApproveHours, setAutoApproveHours] = useState(48);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (group) {
      if (group.my_role !== 'owner') {
        navigate(`/groups/${id}`);
        return;
      }
      setName(group.name);
      setDescription(group.description ?? '');
      setApprovalThreshold(group.approval_threshold);
      setAutoApproveHours(group.auto_approve_hours ?? 48);
    }
  }, [group, id, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          approval_threshold: approvalThreshold,
          auto_approve_hours: autoApproveHours,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (group?.my_role !== 'owner') return null;

  return (
    <div className="max-w-lg">
      <h2 className="font-display text-2xl font-bold text-ink">Crew settings</h2>
      <p className="mt-2 text-sm text-ink-muted">Owner only — how vouching and auto-approval work.</p>

      {error && <p className="alert-error mt-6">{error}</p>}
      {saved && <p className="alert-success mt-6">Saved.</p>}

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <div>
          <label className="label-caps">Crew name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label-caps">About</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="textarea" rows={2} />
        </div>
        <div>
          <label className="label-caps">Vouches needed to count — {approvalThreshold}</label>
          <input
            type="range"
            min={1}
            max={5}
            value={approvalThreshold}
            onChange={(e) => setApprovalThreshold(Number(e.target.value))}
            className="mt-3 w-full accent-accent"
          />
        </div>
        <div>
          <label className="label-caps">Auto-approve after — {autoApproveHours}h</label>
          <input
            type="range"
            min={12}
            max={168}
            step={12}
            value={autoApproveHours}
            onChange={(e) => setAutoApproveHours(Number(e.target.value))}
            className="mt-3 w-full accent-accent"
          />
          <p className="mt-2 text-xs text-ink-muted">
            Pending submissions are automatically approved if nobody votes within this window.
          </p>
        </div>
        <button type="submit" className="btn btn-primary">Save settings</button>
      </form>
    </div>
  );
}
