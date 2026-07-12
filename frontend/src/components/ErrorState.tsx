import { Link } from 'react-router-dom';
import { ApiError } from '../lib/errors';

type ErrorStateProps = {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  homeLink?: boolean;
};

export function ErrorState({ error, title, onRetry, homeLink = true }: ErrorStateProps) {
  const status = error instanceof ApiError ? error.status : undefined;
  const message =
    error instanceof Error
      ? error.message
      : 'Something went wrong. Try again.';

  const heading =
    title ??
    (status === 404
      ? 'Not found'
      : status === 403
        ? 'Access denied'
        : status === 401
          ? 'Session expired'
          : status === 0
            ? 'Connection problem'
            : 'Something went wrong');

  return (
    <div className="error-state" role="alert">
      {status !== undefined && status > 0 && (
        <p className="error-state-code font-mono">{status}</p>
      )}
      <h2 className="error-state-title font-display">{heading}</h2>
      <p className="error-state-body">{message}</p>
      <div className="error-state-actions">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Try again
          </button>
        )}
        {status === 401 && (
          <Link to="/login" className="btn btn-accent">
            Sign in
          </Link>
        )}
        {homeLink && status !== 401 && (
          <Link to="/dashboard" className="btn btn-ghost">
            Back to crews
          </Link>
        )}
      </div>
    </div>
  );
}
