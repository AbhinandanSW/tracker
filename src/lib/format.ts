const MS_PER_DAY = 86_400_000;

export function parseDayKey(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, (month || 1) - 1, date || 1);
}

export function toDayKey(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(day: string, amount: number): string {
  const date = parseDayKey(day);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

export function daysBetween(fromDay: string, toDay = toDayKey()): number {
  const from = parseDayKey(fromDay).getTime();
  const to = parseDayKey(toDay).getTime();
  return Math.round((to - from) / MS_PER_DAY);
}

export function dayLabel(day: string): string {
  const diff = daysBetween(day);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) {
    return parseDayKey(day).toLocaleDateString(undefined, { weekday: 'long' });
  }
  const sameYear = parseDayKey(day).getFullYear() === new Date().getFullYear();
  return parseDayKey(day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatDay(day: string): string {
  return parseDayKey(day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return '';
  if (diff < 45_000) return 'just now';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function isNewJob(firstSeen: string, newDays = 3): boolean {
  const diff = daysBetween(firstSeen);
  return diff >= 0 && diff <= newDays;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function initials(value: string): string {
  const words = value
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#2F5BE8',
  '#0E7C5A',
  '#B45309',
  '#7C3AED',
  '#BE123C',
  '#0E7490',
  '#4D7C0F',
  '#9A3412',
] as const;

export function avatarColor(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function pluralize(value: number, singular: string, plural = `${singular}s`): string {
  return `${formatCount(value)} ${value === 1 ? singular : plural}`;
}

export function normalize(value: string): string {
  return value.toLowerCase().normalize('NFKD');
}

export function matchesQuery(query: string, fields: (string | undefined | null)[]): boolean {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  const haystack = normalize(fields.filter(Boolean).join(' '));
  return tokens.every((token) => haystack.includes(token));
}
