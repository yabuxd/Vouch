/**
 * Timezone helpers for per-user assignment deadlines.
 * Uses Intl when available; falls back to UTC date strings.
 */

export function localDateString(date: Date, timezone: string): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return date.toISOString().split('T')[0];
  }
}

export function endOfWeekLocal(timezone: string, ref = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    const weekday = formatter.format(ref);
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const day = dayMap[weekday.slice(0, 3)] ?? 0;
    const diff = day === 0 ? 0 : 7 - day;
    const end = new Date(ref);
    end.setDate(end.getDate() + diff);
    return localDateString(end, timezone);
  } catch {
    const d = new Date(ref);
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }
}

export function todayLocal(timezone: string): string {
  return localDateString(new Date(), timezone);
}

export function yesterdayLocal(timezone: string): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d, timezone);
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
