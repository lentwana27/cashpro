import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type Period = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'ALL', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'WEEK', label: 'This Week' },
  { value: 'MONTH', label: 'This Month' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

// Returns inclusive yyyy-MM-dd bounds; an empty string means "unbounded".
export function getPeriodRange(period: Period, customFrom = '', customTo = ''): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  if (period === 'TODAY') return { from: fmt(now), to: fmt(now) };
  if (period === 'WEEK') return { from: fmt(startOfWeek(now, { weekStartsOn: 1 })), to: fmt(endOfWeek(now, { weekStartsOn: 1 })) };
  if (period === 'MONTH') return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
  if (period === 'CUSTOM') return { from: customFrom, to: customTo };
  return { from: '', to: '' };
}

export function inRange(date: string | undefined, range: { from: string; to: string }) {
  const d = date || '';
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}
