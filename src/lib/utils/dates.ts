import {
  differenceInDays,
  format,
  isAfter,
  isBefore,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from 'date-fns';

/**
 * Format date nicely, e.g. "Oct 14, 2026" or "Tomorrow"
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return format(date, 'MMM d, yyyy');
}

/**
 * Format short date, e.g. "Oct 14"
 */
export function formatShortDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return format(date, 'MMM d');
}

/**
 * Calculate days remaining until a target date from today
 */
export function getDaysUntil(dateInput: string | Date): number {
  const targetDate = startOfDay(
    typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  );
  const today = startOfDay(new Date());
  return differenceInDays(targetDate, today);
}

/**
 * Return friendly relative label for upcoming renewals / trials
 */
export function getCountdownBadge(dateInput: string | Date): {
  label: string;
  urgent: boolean;
  warning: boolean;
  days: number;
} {
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const days = getDaysUntil(date);

  if (isToday(date) || days === 0) {
    return { label: 'Today', urgent: true, warning: false, days: 0 };
  }
  if (isTomorrow(date) || days === 1) {
    return { label: 'Tomorrow', urgent: true, warning: false, days: 1 };
  }
  if (days < 0) {
    return { label: `${Math.abs(days)}d overdue`, urgent: true, warning: false, days };
  }
  if (days <= 3) {
    return { label: `In ${days} days`, urgent: false, warning: true, days };
  }
  if (days <= 7) {
    return { label: `In ${days} days`, urgent: false, warning: false, days };
  }
  return { label: formatShortDate(date), urgent: false, warning: false, days };
}

/**
 * Checks if a renewal is occurring within specified days (default 7 days)
 */
export function isUpcomingSoon(dateInput: string | Date, withinDays: number = 7): boolean {
  const days = getDaysUntil(dateInput);
  return days >= 0 && days <= withinDays;
}
