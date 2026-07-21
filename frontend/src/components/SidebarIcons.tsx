type IconProps = { className?: string };

const cn = (className?: string) => `sidebar-icon ${className ?? ''}`.trim();

export function IconOverview({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconTasks({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 5.5h12M4 10h12M4 14.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.5 14.5l1 1 2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconProof({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 13l3.5-3 2.5 2 4-4.5 4 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconVouch({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 10l2.5 2.5L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconStandings({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 16V9M10 16V4M16 16v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M4.9 15.1l1.4-1.4M13.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAddCrew({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 12.5c1.2-1.5 3.3-1.8 4.8-.5 1.5 1.2 1.7 3.4.4 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 5v4M12 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconInvite({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 8h3M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="6.5" y="6.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 13.5V5.5a1.5 1.5 0 0 1 1.5-1.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5V10l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShieldCheck({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5L4.5 4.75v4.75c0 3.25 2.35 6.3 5.5 7.25 3.15-.95 5.5-4 5.5-7.25V4.75L10 2.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.5 10l1.75 1.75L12.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSignOut({ className }: IconProps) {
  return (
    <svg className={cn(className)} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M8 4H4v12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 10H17M17 10l-2-2M17 10l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
