import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="error-page">
      <p className="error-state-code font-mono">404</p>
      <h1 className="error-state-title font-display">Page not found</h1>
      <p className="error-state-body">
        That route does not exist. Head back and pick up where you left off.
      </p>
      <div className="error-state-actions">
        <Link to="/" className="btn btn-accent">
          Home
        </Link>
        <Link to="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
