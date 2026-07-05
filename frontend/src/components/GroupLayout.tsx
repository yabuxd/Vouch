import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Group } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const tabs = [
  { to: '', label: 'Overview', end: true },
  { to: 'tasks', label: 'Tasks' },
  { to: 'submit', label: 'Send proof' },
  { to: 'approve', label: 'Vouch' },
  { to: 'leaderboard', label: 'Standings' },
  { to: 'settings', label: 'Settings' },
];

export function GroupLayout() {
  const { id } = useParams<{ id: string }>();
  const { signOut } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (id) api<Group>(`/groups/${id}`).then(setGroup).catch(console.error);
  }, [id]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="panel">
        <div className="mx-auto flex max-w-5xl items-end justify-between px-6 py-5 md:px-10">
          <div>
            <Link to="/dashboard" className="text-xs text-ink-muted hover:text-accent">
              ← All crews
            </Link>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">
              {group?.name ?? '…'}
            </h1>
          </div>
          <button onClick={signOut} className="hidden text-sm text-ink-muted hover:text-ink md:block">
            Sign out
          </button>
        </div>
      </header>

      <nav className="border-b border-rule bg-raised">
        <div className="mx-auto flex max-w-5xl overflow-x-auto px-6 md:px-10">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to ? `/groups/${id}/${tab.to}` : `/groups/${id}`}
              end={tab.end}
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-12">
        <Outlet context={{ group }} />
      </main>
    </div>
  );
}
