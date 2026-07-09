export function HeroMock() {
  return (
    <div className="landing-mock" aria-hidden>
      <div className="landing-mock-sidebar">
        <div className="landing-mock-brand">V</div>
        <div className="landing-mock-nav-item landing-mock-nav-active" />
        <div className="landing-mock-nav-item" />
        <div className="landing-mock-nav-item" />
        <div className="landing-mock-nav-item" />
      </div>
      <div className="landing-mock-main">
        <div className="landing-mock-stats">
          <div><span className="landing-mock-label">Rank</span><strong>2</strong></div>
          <div><span className="landing-mock-label">Points</span><strong className="text-accent">48</strong></div>
          <div><span className="landing-mock-label">Streak</span><strong className="text-streak">5d</strong></div>
        </div>
        <div className="landing-mock-card">
          <div className="landing-mock-card-head">
            <span className="landing-mock-badge">Group task</span>
            <span className="landing-mock-pending">pending</span>
          </div>
          <p className="landing-mock-task">Study 1 hour</p>
          <div className="landing-mock-proof">
            <div className="landing-mock-proof-img" />
            <div>
              <p className="landing-mock-proof-title">Proof from Alex</p>
              <p className="landing-mock-proof-sub">Waiting for your vouch</p>
              <div className="landing-mock-vouch-row">
                <span className="landing-mock-vouch-yes">Vouch</span>
                <span className="landing-mock-vouch-no">Reject</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
