export function polishGoalTitle(title: string): string {
  return title
    .replace(/\bweel\b/gi, 'week')
    .replace(/^(\w)/, (m) => m.toUpperCase());
}

export function polishGoalDescription(description: string): string {
  const trimmed = description.trim();
  if (/^on my telegram\.?$/i.test(trimmed)) {
    return 'On my Telegram channel';
  }
  return description.replace(/\bon my telegram\b/gi, 'On my Telegram channel');
}

export function formatFrequency(frequency: string): string {
  const labels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    one_time: 'One-time',
  };
  return labels[frequency] ?? frequency;
}

export function formatDueDate(dueDate: string): string {
  const due = new Date(`${dueDate}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const explicit = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const dueDay = new Date(due);
  dueDay.setHours(12, 0, 0, 0);
  const diffMs = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return `Due today, ${explicit}`;
  if (diffDays === 1) return `Due tomorrow, ${explicit}`;
  if (diffDays === -1) return `Due yesterday, ${explicit}`;
  if (diffDays > 1 && diffDays <= 7) return `Due in ${diffDays} days, ${explicit}`;

  return `Due ${explicit}`;
}
