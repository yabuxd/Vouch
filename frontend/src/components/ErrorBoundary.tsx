import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crash:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-page" role="alert">
          <p className="error-state-code font-mono">500</p>
          <h1 className="error-state-title font-display">Something broke</h1>
          <p className="error-state-body">
            {this.state.error.message || 'An unexpected error stopped this screen.'}
          </p>
          <div className="error-state-actions">
            <button type="button" className="btn btn-primary" onClick={this.reset}>
              Try again
            </button>
            <Link to="/dashboard" className="btn btn-ghost" onClick={this.reset}>
              Back to crews
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
