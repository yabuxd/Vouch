import { useState } from 'react';
import { api, type MissedEvent } from '../../lib/api';

const DEFAULT_EMOJIS = ['😅', '💀', '🫡', '👀', '🔥'];

type Props = {
  event: MissedEvent;
  availableEmojis?: string[];
  onReactionChange?: () => void;
};

function memberInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export function MissedEventCard({ event, availableEmojis = DEFAULT_EMOJIS, onReactionChange }: Props) {
  const [reacting, setReacting] = useState(false);
  const emojis = availableEmojis.length ? availableEmojis : DEFAULT_EMOJIS;

  const handleReact = async (emoji: string) => {
    if (reacting) return;
    setReacting(true);
    try {
      await api(`/missed-events/${event.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      });
      onReactionChange?.();
    } catch (err) {
      console.error(err);
    } finally {
      setReacting(false);
    }
  };

  return (
    <article className="missed-card">
      <div className="missed-card-header">
        {event.member.avatar_url ? (
          <img src={event.member.avatar_url} alt="" className="missed-card-avatar" />
        ) : (
          <span className="missed-card-avatar missed-card-avatar-fallback">
            {memberInitial(event.member.name)}
          </span>
        )}
        <div className="missed-card-copy">
          <p className="missed-card-line">
            <strong>{event.member.name}</strong>
            <span className="text-ink-muted"> missed </span>
            <span className="text-accent">{event.goal.title}</span>
          </p>
          <p className="missed-card-streak">
            {event.streak_before > 0 ? (
              <span className="text-streak">
                🔥 <span className="font-mono">{event.streak_before}</span>
                <span className="text-ink-muted"> → </span>
                <span className="font-mono text-ink-muted">0</span>
              </span>
            ) : (
              <span className="text-sm text-ink-muted">Streak stays at 0 — tomorrow&apos;s another run</span>
            )}
          </p>
        </div>
        <time className="missed-card-time">
          {new Date(event.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </time>
      </div>

      {event.reaction_counts.length > 0 && (
        <div className="missed-card-counts">
          {event.reaction_counts.map(({ emoji, count }) => (
            <span key={emoji} className="missed-reaction-pill">
              {emoji} <span className="font-mono">{count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="missed-card-actions">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`missed-react-btn${event.my_reaction === emoji ? ' missed-react-btn-active' : ''}`}
            onClick={() => handleReact(emoji)}
            disabled={reacting}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </article>
  );
}
