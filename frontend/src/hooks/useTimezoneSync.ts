import { useEffect } from 'react';
import { api } from '../lib/api';

export function useTimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;

    api<{ timezone: string }>('/users/me')
      .then((profile) => {
        if (profile.timezone === 'UTC' || !profile.timezone) {
          return api('/users/me', {
            method: 'PATCH',
            body: JSON.stringify({ timezone: tz }),
          });
        }
      })
      .catch(() => {});
  }, []);
}
