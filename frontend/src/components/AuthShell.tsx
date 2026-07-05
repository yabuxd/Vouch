import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="auth-noise flex flex-col justify-between px-8 py-10 text-raised md:w-[42%] md:px-12 md:py-16">
        <Link to="/login" className="font-display text-3xl font-bold tracking-tight text-raised md:text-4xl">
          Vouch
        </Link>
        <div className="mt-12 md:mt-0">
          <p className="font-display text-2xl leading-snug text-raised/90 md:text-3xl">
            Your crew vouches.
            <br />
            Your proof counts.
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-raised/50">
            Submit proof. Get vouched. Climb the board.
          </p>
        </div>
        <p className="mt-8 hidden text-xs text-raised/30 md:block">Peer accountability, not solo willpower.</p>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-raised px-8 py-12 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
