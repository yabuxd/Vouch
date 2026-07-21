import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type NotificationItem } from '../lib/api';

function formatNotification(n: NotificationItem): { title: string; body: string; href?: string } {
  const p = n.payload;
  switch (n.type) {
    case 'deadline_approaching':
      return {
        title: 'Deadline approaching',
        body: `"${p.goal_title as string}" in ${p.group_name as string} — due ${p.due_date as string}`,
        href: p.group_id ? `/groups/${p.group_id}/tasks` : undefined,
      };
    case 'vouch_needed':
      return {
        title: 'Vouch needed',
        body: `Proof waiting for "${p.goal_title as string}" in ${p.group_name as string}`,
        href: p.group_id ? `/groups/${p.group_id}/approve` : undefined,
      };
    case 'quest_missed': {
      const misses = (p.misses as Array<{ member_name: string; goal_title: string }>) ?? [];
      const summary =
        misses.length === 1
          ? `${misses[0].member_name} missed ${misses[0].goal_title}`
          : `${misses.length} missed quests in ${p.group_name as string}`;
      return {
        title: 'Crew missed quests',
        body: summary,
        href: p.group_id ? `/groups/${p.group_id}` : undefined,
      };
    }
    case 'submission_resolved':
      return {
        title: p.status === 'approved' ? 'Proof approved' : 'Proof rejected',
        body: `"${p.goal_title as string}" in ${p.group_name as string}`,
        href: p.group_id ? `/groups/${p.group_id}` : undefined,
      };
    case 'crew_suggestion':
      return {
        title: 'Find a crew',
        body: (p.message as string) ?? 'Discover crews that match your quests',
        href: '/dashboard/discover',
      };
    default:
      return { title: 'Notification', body: '' };
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ notifications: NotificationItem[]; unread_count: number }>(
        '/notifications?limit=20'
      );
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: 'PATCH' });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnread((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api('/notifications/mark-all-read', { method: 'POST' });
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnread(0);
  };

  const handleClick = async (n: NotificationItem, href?: string) => {
    if (!n.read_at) await markRead(n.id);
    if (href) setOpen(false);
  };

  return (
    <div className="notification-bell-wrap" ref={panelRef}>
      <button
        type="button"
        className="notification-bell-btn"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="notification-bell-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5v2.1l-.9 1.8a1 1 0 0 0 .9 1.45h9a1 1 0 0 0 .9-1.45l-.9-1.8V7a4.5 4.5 0 0 0-4.5-4.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8.25 15.5a1.75 1.75 0 0 0 3.5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="notification-bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-head">
            <p className="label-caps">Notifications</p>
            {unread > 0 && (
              <button type="button" className="notification-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {loading && items.length === 0 ? (
            <p className="notification-empty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="notification-empty">You&apos;re all caught up.</p>
          ) : (
            <ul className="notification-list">
              {items.map((n) => {
                const { title, body, href } = formatNotification(n);
                const content = (
                  <>
                    <p className="notification-item-title">{title}</p>
                    <p className="notification-item-body">{body}</p>
                    <time className="notification-item-time">
                      {new Date(n.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </>
                );
                return (
                  <li key={n.id} className={n.read_at ? 'notification-item-read' : ''}>
                    {href ? (
                      <Link
                        to={href}
                        className="notification-item"
                        onClick={() => handleClick(n, href)}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="notification-item"
                        onClick={() => handleClick(n)}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
