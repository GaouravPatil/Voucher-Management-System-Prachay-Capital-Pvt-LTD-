import { env } from '../config/env.js';

export function todayInTimezone(tz: string): string {
  try {
    // en-CA yields YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function isFutureDate(isoDate: string): boolean {
  // Compare against the latest of UTC today and APP_TIMEZONE today,
  // so "today" is never rejected near midnight for IST users.
  const utcToday = new Date().toISOString().slice(0, 10);
  let tzToday = utcToday;
  try {
    tzToday = todayInTimezone(env.APP_TIMEZONE);
  } catch {
    /* ignore */
  }
  const today = utcToday > tzToday ? utcToday : tzToday;
  return isoDate > today;
}
