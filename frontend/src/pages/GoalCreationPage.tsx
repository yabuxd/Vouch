import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { api, type Group } from '../lib/api';

export function GoalCreationPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = searchParams.get('type') === 'group' ? 'group' : 'individual';
  const isOwner = group?.my_role === 'owner';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'group' | 'individual'>(initialType);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'one_time'>('daily');
  const [pointsValue, setPointsValue] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialType === 'group' && isOwner) setType('group');
    else setType('individual');
  }, [initialType, isOwner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'group' && !isOwner) {
      setError('Only the crew owner can create group tasks');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api(`/groups/${id}/goals`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          type,
          frequency,
          points_value: pointsValue,
          due_date: frequency === 'one_time' ? dueDate : undefined,
        }),
      });
      navigate(`/groups/${id}/tasks`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <Link to={`/groups/${id}/tasks`} className="text-sm text-ink-muted hover:text-accent">← Back to tasks</Link>
      <h2 className="mt-6 font-display text-2xl font-bold text-ink">Add a task</h2>
      <p className="mt-2 text-sm text-ink-muted">Who&apos;s accountable, and how often?</p>

      {error && <p className="alert-error mt-6">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!isOwner}
          onClick={() => setType('group')}
          className={`type-card ${type === 'group' ? 'type-card-selected-group' : ''}`}
        >
          <p className="font-semibold text-ink">Group task</p>
          <p className="mt-1 text-xs text-ink-muted">Whole crew must complete</p>
        </button>
        <button
          type="button"
          onClick={() => setType('individual')}
          className={`type-card ${type === 'individual' ? 'type-card-selected-personal' : ''}`}
        >
          <p className="font-semibold text-ink">My task</p>
          <p className="mt-1 text-xs text-ink-muted">Just you, on the line</p>
        </button>
      </div>

      {!isOwner && <p className="mt-3 text-xs text-ink-muted">Group tasks require the crew owner.</p>}

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div>
          <label className="label-caps">Task name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Study 1 hour, run 5k…" className="input" />
        </div>
        <div>
          <label className="label-caps">What counts as done?</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" className="textarea" rows={2} />
        </div>
        <div>
          <label className="label-caps">Schedule</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className="select">
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="one_time">One-time deadline</option>
          </select>
        </div>
        {frequency === 'one_time' && (
          <div>
            <label className="label-caps">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="input" />
          </div>
        )}
        <div>
          <label className="label-caps">Points when vouched</label>
          <input type="number" min={1} max={100} value={pointsValue} onChange={(e) => setPointsValue(Number(e.target.value))} className="input" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-full">
          {loading ? 'Creating…' : type === 'group' ? 'Create group task' : 'Create my task'}
        </button>
      </form>
    </div>
  );
}
