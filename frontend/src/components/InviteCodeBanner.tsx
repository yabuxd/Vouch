import { useState } from 'react';
import type { Group } from '../lib/api';
import { IconCopy } from './SidebarIcons';

export function InviteCodeBanner({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/join?code=${group.invite_code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="invite-card">
      <p className="label-caps section-eyebrow">Invite to crew</p>
      <p className="invite-code">{group.invite_code}</p>
      <button type="button" onClick={copy} className="btn btn-ghost btn-sm invite-copy-btn">
        <IconCopy className="invite-copy-icon" />
        {copied ? 'Copied' : 'Copy invite link'}
      </button>
    </div>
  );
}
