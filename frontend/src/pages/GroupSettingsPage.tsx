import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, type CrewJoinRequest, type Group } from '../lib/api';
import { toUserErrorMessage } from '../lib/errors';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['fitness', 'study', 'creative', 'productivity', 'other'];

export function GroupSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = group?.my_role === 'owner';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState(2);
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [category, setCategory] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [joinRequests, setJoinRequests] = useState<CrewJoinRequest[]>([]);
  const [transferTarget, setTransferTarget] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? '');
      setApprovalThreshold(group.approval_threshold);
      setIsDiscoverable(group.is_discoverable ?? false);
      setCategory(group.category ?? '');
    }
  }, [group]);

  useEffect(() => {
    api<{ timezone: string }>('/users/me')
      .then((p) => setTimezone(p.timezone || 'UTC'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id || !isOwner) return;
    api<CrewJoinRequest[]>(`/crews/${id}/join-requests`)
      .then(setJoinRequests)
      .catch(() => setJoinRequests([]));
  }, [id, isOwner]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setError('');
    setBusy(true);
    try {
      await api(`/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          approval_threshold: approvalThreshold,
          is_discoverable: isDiscoverable,
          category: category || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveTimezone = async () => {
    setError('');
    setBusy(true);
    try {
      await api('/users/me', { method: 'PATCH', body: JSON.stringify({ timezone }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!window.confirm('Remove this member from the crew?')) return;
    setBusy(true);
    try {
      await api(`/crews/${id}/members/${userId}`, { method: 'DELETE' });
      window.location.reload();
    } catch (err) {
      setError(toUserErrorMessage(err));
      setBusy(false);
    }
  };

  const leaveCrew = async () => {
    if (!window.confirm('Leave this crew? Your past submissions stay in crew history.')) return;
    setBusy(true);
    try {
      await api(`/crews/${id}/members/me`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch (err) {
      setError(toUserErrorMessage(err));
      setBusy(false);
    }
  };

  const transferOwnership = async () => {
    if (!transferTarget) return;
    setBusy(true);
    try {
      await api(`/crews/${id}/owner`, {
        method: 'PATCH',
        body: JSON.stringify({ new_owner_id: transferTarget }),
      });
      setShowTransferModal(false);
      window.location.reload();
    } catch (err) {
      setError(toUserErrorMessage(err));
      setBusy(false);
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'deny') => {
    setBusy(true);
    try {
      await api(`/crews/${id}/join-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(toUserErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const otherMembers = (group?.members ?? []).filter((m) => m.user_id !== user?.id);

  return (
    <div className="max-w-lg space-y-12">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Crew settings</h2>
        <p className="mt-2 text-sm text-ink-muted">Manage membership and preferences.</p>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {saved && <p className="alert-success">Saved.</p>}

      <section>
        <p className="label-caps">Your timezone</p>
        <p className="mt-2 text-sm text-ink-muted">Quest deadlines use this timezone.</p>
        <div className="mt-4 flex gap-3">
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input flex-1 font-mono text-sm"
            placeholder="America/New_York"
          />
          <button type="button" onClick={saveTimezone} disabled={busy} className="btn btn-ghost">
            Save
          </button>
        </div>
      </section>

      {isOwner && (
        <form onSubmit={handleSave} className="space-y-6">
          <p className="label-caps">Owner settings</p>
          <div>
            <label className="label-caps">Crew name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label-caps">About</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="textarea" rows={2} />
          </div>
          <div>
            <label className="label-caps">Vouches needed — {approvalThreshold}</label>
            <input
              type="range"
              min={1}
              max={5}
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(Number(e.target.value))}
              className="mt-3 w-full accent-accent"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={isDiscoverable} onChange={(e) => setIsDiscoverable(e.target.checked)} className="accent-accent" />
            List in crew discovery
          </label>
          {isDiscoverable && (
            <div>
              <label className="label-caps">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={busy} className="btn btn-primary">Save crew settings</button>
        </form>
      )}

      {isOwner && joinRequests.length > 0 && (
        <section>
          <p className="label-caps">Pending join requests</p>
          <ul className="member-list mt-4">
            {joinRequests.map((r) => (
              <li key={r.id} className="member-row">
                <span>{r.profiles?.name ?? 'User'}</span>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={() => handleJoinRequest(r.id, 'approve')}>Approve</button>
                  <button type="button" className="btn btn-reject btn-sm" disabled={busy} onClick={() => handleJoinRequest(r.id, 'deny')}>Deny</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <p className="label-caps">Members</p>
        <ul className="member-list mt-4">
          {(group?.members ?? []).map((m) => (
            <li key={m.user_id} className="member-row">
              <span>
                {m.profiles?.name ?? 'Member'}
                {m.role === 'owner' && <span className="member-role-badge">owner</span>}
              </span>
              {isOwner && m.user_id !== user?.id && m.role !== 'owner' && (
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => removeMember(m.user_id)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && otherMembers.length > 0 && (
        <section>
          <p className="label-caps">Transfer ownership</p>
          <button type="button" className="btn btn-ghost mt-4" onClick={() => setShowTransferModal(true)}>
            Transfer to another member
          </button>
        </section>
      )}

      <section>
        <button type="button" className="btn btn-reject" disabled={busy} onClick={leaveCrew}>
          Leave crew
        </button>
      </section>

      {showTransferModal && (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <p className="font-display text-lg font-semibold">Transfer ownership</p>
            <p className="mt-2 text-sm text-ink-muted">You will become a regular member. This cannot be undone without the new owner.</p>
            <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} className="input mt-6">
              <option value="">Select member</option>
              {otherMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.profiles?.name ?? m.user_id}</option>
              ))}
            </select>
            <div className="modal-actions mt-6">
              <button type="button" className="btn btn-ghost" onClick={() => setShowTransferModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={!transferTarget || busy} onClick={transferOwnership}>
                Confirm transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
