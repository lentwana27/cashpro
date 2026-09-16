import { format, isValid } from 'date-fns';

export function safeFormat(dateString: any, formatStr: string = 'MMM dd, yyyy') {
  if (!dateString) return 'Invalid Date';
  const date = new Date(dateString);
  if (!isValid(date)) return 'Invalid Date';
  return format(date, formatStr);
}
