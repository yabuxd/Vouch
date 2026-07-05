import { useState } from 'react';
import type { Group } from '../lib/api';

export function InviteCodeBanner({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/join?code=${group.invite_code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-rule border-t-[3px] border-t-accent bg-raised px-5 py-4">
      <p className="label-caps">Invite to crew</p>
      <p className="mt-2 font-mono text-xl font-medium tracking-[0.2em] text-ink">
        {group.invite_code}
      </p>
      <button onClick={copy} className="btn btn-ghost mt-3">
        {copied ? 'Copied' : 'Copy invite link'}
      </button>
    </div>
  );
}
