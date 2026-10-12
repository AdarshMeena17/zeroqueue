// Backend display tokens look like "A-47". The UI presents them as "A-047".
export function formatToken(displayToken) {
  if (!displayToken) return null;
  const match = /^(.*?)-(\d+)$/.exec(displayToken);
  if (!match) return displayToken;
  return `${match[1]}-${match[2].padStart(3, '0')}`;
}

export function tokenFrom(prefix, number) {
  if (number === undefined || number === null || number === 0) return null;
  return formatToken(`${prefix}-${number}`);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const ENTRY_STATUS = {
  waiting: { label: 'Waiting', variant: 'outline' },
  serving: { label: 'Serving', variant: 'serving' },
  completed: { label: 'Completed', variant: 'active' },
  skipped: { label: 'Skipped', variant: 'paused' },
  cancelled: { label: 'Left queue', variant: 'default' },
};

// Privacy: never show more of a person than the task needs. "Adarsh Meena" -> "Adarsh M."
export function displayName(user) {
  const name = typeof user === 'object' && user ? user.name : null;
  if (!name || typeof name !== 'string') return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
