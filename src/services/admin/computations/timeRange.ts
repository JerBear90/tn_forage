/**
 * Time-range filtering utilities and preset resolvers.
 *
 * All functions are pure — no side effects, no PocketBase calls.
 */

import type { TimeRange, TimeRangePreset } from '@/types/admin-dashboard';

/**
 * Returns a new Date set to the start of the given day (00:00:00.000).
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a new Date set to the end of the given day (23:59:59.999).
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Filters records whose timestamp falls within [startDate, endDate] inclusive.
 *
 * @param records - Array of records to filter
 * @param timeRange - The time range with startDate and endDate
 * @param getTimestamp - Accessor function to extract the ISO timestamp string from a record
 * @returns Filtered array containing only records within the time range
 */
export function filterByTimeRange<T>(
  records: T[],
  timeRange: TimeRange,
  getTimestamp: (record: T) => string
): T[] {
  const start = timeRange.startDate.getTime();
  const end = timeRange.endDate.getTime();

  return records.filter((record) => {
    const ts = new Date(getTimestamp(record)).getTime();
    return ts >= start && ts <= end;
  });
}

/**
 * Converts a TimeRangePreset into a concrete TimeRange with start/end dates.
 *
 * - 'today': start of today to end of today
 * - '7d': 7 days ago (start of day) to end of today
 * - '30d': 30 days ago (start of day) to end of today
 * - '90d': 90 days ago (start of day) to end of today
 * - 'custom': returns a default 30-day range (callers should override with actual dates)
 */
export function resolvePreset(preset: TimeRangePreset): TimeRange {
  const now = new Date();
  const todayEnd = endOfDay(now);

  switch (preset) {
    case 'today':
      return {
        label: 'Today',
        startDate: startOfDay(now),
        endDate: todayEnd,
      };
    case '7d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return {
        label: 'Last 7 days',
        startDate: startOfDay(start),
        endDate: todayEnd,
      };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return {
        label: 'Last 30 days',
        startDate: startOfDay(start),
        endDate: todayEnd,
      };
    }
    case '90d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 89);
      return {
        label: 'Last 90 days',
        startDate: startOfDay(start),
        endDate: todayEnd,
      };
    }
    case 'custom': {
      // Default fallback for custom — callers should provide their own range
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return {
        label: 'Custom',
        startDate: startOfDay(start),
        endDate: todayEnd,
      };
    }
  }
}
