import { Skeleton } from './Skeleton';

export function MissedFeedSkeleton() {
  return (
    <div className="missed-list" aria-busy="true" aria-label="Loading missed quests">
      {[0, 1, 2].map((i) => (
        <article key={i} className="missed-card skeleton-card" aria-hidden>
          <div className="missed-card-header">
            <Skeleton className="skeleton-avatar skeleton-circle" />
            <div className="missed-card-copy">
              <Skeleton className="skeleton-missed-line" />
              <Skeleton className="skeleton-missed-streak" />
            </div>
            <Skeleton className="skeleton-missed-time" />
          </div>
          <div className="missed-card-actions skeleton-missed-actions">
            {[0, 1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="skeleton-emoji-btn" />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function QuestRowSkeleton() {
  return (
    <div className="quest-card quest-card-row skeleton-card" aria-hidden>
      <div className="quest-card-body">
        <div className="quest-card-top">
          <Skeleton className="skeleton-quest-title" />
          <Skeleton className="skeleton-quest-points" />
        </div>
        <Skeleton className="skeleton-quest-desc" />
        <Skeleton className="skeleton-quest-meta" />
      </div>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-14" aria-busy="true" aria-label="Loading quests">
      {[0, 1].map((section) => (
        <section key={section} aria-hidden>
          <div className="section-header">
            <div>
              <Skeleton className="skeleton-section-label" />
              <Skeleton className="skeleton-section-sub" />
            </div>
            <Skeleton className="skeleton-section-action" />
          </div>
          <div className="quest-list">
            {[0, 1, 2].map((i) => (
              <QuestRowSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CrewListSkeleton() {
  return (
    <ul className="crew-card-list" aria-busy="true" aria-label="Loading your crews">
      {[0, 1, 2].map((i) => (
        <li key={i} aria-hidden>
          <div className="crew-card skeleton-card">
            <div className="crew-card-main">
              <Skeleton className="skeleton-crew-name" />
              <Skeleton className="skeleton-crew-desc" />
              <div className="crew-card-meta">
                <Skeleton className="skeleton-crew-badge" />
                <Skeleton className="skeleton-crew-role" />
              </div>
            </div>
            <div className="crew-card-score">
              <Skeleton className="skeleton-crew-points" />
              <Skeleton className="skeleton-crew-pts-label" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ApprovalQueueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading queue">
      <div className="section-header section-header-flush" aria-hidden>
        <div>
          <Skeleton className="skeleton-page-title" />
          <Skeleton className="skeleton-section-sub" />
        </div>
      </div>
      <div className="mt-10 space-y-10">
        {[0, 1].map((i) => (
          <article key={i} className="vouch-card skeleton-card" aria-hidden>
            <Skeleton className="skeleton-vouch-img" />
            <div className="vouch-card-body">
              <div className="flex items-baseline justify-between gap-4">
                <Skeleton className="skeleton-vouch-name" />
                <Skeleton className="skeleton-vouch-date" />
              </div>
              <Skeleton className="skeleton-vouch-goal" />
              <Skeleton className="skeleton-vouch-progress" />
              <div className="mt-6 flex gap-3">
                <Skeleton className="skeleton-vouch-btn" />
                <Skeleton className="skeleton-vouch-btn" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function GroupLayoutSkeleton() {
  return (
    <div className="app-shell" aria-busy="true" aria-label="Loading crew">
      <aside className="sidebar skeleton-sidebar" aria-hidden>
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <Skeleton className="skeleton-brand" />
          </div>
          <div className="sidebar-header">
            <Skeleton className="skeleton-back-link" />
            <Skeleton className="skeleton-group-name" />
            <div className="sidebar-player-card">
              <Skeleton className="skeleton-player-row" />
              <Skeleton className="skeleton-xp-bar" />
            </div>
            <Skeleton className="skeleton-label-caps" />
          </div>
        </div>
        <nav className="sidebar-nav">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-nav-item">
              <Skeleton className="skeleton-nav-icon skeleton-circle" />
              <Skeleton className="skeleton-nav-label" />
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="skeleton-nav-item">
            <Skeleton className="skeleton-nav-icon skeleton-circle" />
            <Skeleton className="skeleton-nav-label" />
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="mobile-topbar">
          <Skeleton className="skeleton-hamburger" />
          <Skeleton className="skeleton-mobile-title" />
        </header>
        <main className="app-content">
          <OverviewContentSkeleton />
        </main>
      </div>
    </div>
  );
}

function OverviewContentSkeleton() {
  return (
    <div className="space-y-12" aria-hidden>
      <div className="player-panel skeleton-card">
        <div className="player-panel-header">
          <Skeleton className="skeleton-level-badge" />
          <Skeleton className="skeleton-rank-block" />
        </div>
        <div className="player-panel-stats">
          {[0, 1, 2].map((i) => (
            <div key={i} className="player-stat">
              <Skeleton className="skeleton-stat-label" />
              <Skeleton className="skeleton-stat-value" />
            </div>
          ))}
        </div>
        <Skeleton className="skeleton-xp-bar" />
      </div>
      {[0, 1].map((i) => (
        <section key={i}>
          <div className="section-header">
            <div>
              <Skeleton className="skeleton-section-label" />
              <Skeleton className="skeleton-section-sub" />
            </div>
          </div>
          <Skeleton className="skeleton-section-block" />
        </section>
      ))}
    </div>
  );
}
