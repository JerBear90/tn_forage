/**
 * Aggregation utility functions for admin dashboard computations.
 *
 * All functions are pure — no side effects, no PocketBase calls.
 */

import type { TimeRange, TimeSeriesPoint } from '@/types/admin-dashboard';
import { startOfDay } from './timeRange';

/**
 * Returns the top N items sorted in descending order by count.
 *
 * @param items - Array of items to rank
 * @param getCount - Accessor function to extract the numeric count from an item
 * @param n - Maximum number of items to return
 * @returns Array of at most N items sorted descending by count
 */
export function topN<T>(items: T[], getCount: (item: T) => number, n: number): T[] {
  return [...items].sort((a, b) => getCount(b) - getCount(a)).slice(0, n);
}

/**
 * Computes the arithmetic mean of an array of numbers.
 *
 * @param values - Array of numeric values
 * @returns The average value, or 0 for empty arrays
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Computes the p-th percentile of an array of numbers using linear interpolation.
 *
 * @param values - Array of numeric values
 * @param p - Percentile to compute (0–100)
 * @returns The p-th percentile value, or 0 for empty arrays
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);

  if (sorted.length === 1) return sorted[0];

  // Clamp p to [0, 100]
  const clampedP = Math.max(0, Math.min(100, p));

  // Use the "exclusive" percentile method (linear interpolation)
  const index = (clampedP / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

/**
 * Groups timestamped events into time buckets and returns counts per bucket.
 *
 * Buckets span the entire time range. Events outside the range are excluded.
 * Empty buckets (with zero events) are included in the output.
 *
 * @param events - Array of objects with a `timestamp` ISO string field
 * @param bucketSize - Size of each bucket: 'hour', 'day', or 'week'
 * @param timeRange - The time range defining the span of buckets
 * @returns Array of TimeSeriesPoint with bucket start timestamps and event counts
 */
export function groupByTimeBucket(
  events: Array<{ timestamp: string }>,
  bucketSize: 'hour' | 'day' | 'week',
  timeRange: TimeRange
): TimeSeriesPoint[] {
  const start = timeRange.startDate.getTime();
  const end = timeRange.endDate.getTime();

  // Generate bucket boundaries
  const buckets: { start: number; end: number; label: string }[] = [];
  let current = getBucketStart(new Date(start), bucketSize).getTime();

  while (current <= end) {
    const bucketEnd = getNextBucketStart(new Date(current), bucketSize).getTime() - 1;
    buckets.push({
      start: current,
      end: Math.min(bucketEnd, end),
      label: new Date(current).toISOString(),
    });
    current = getNextBucketStart(new Date(current), bucketSize).getTime();
  }

  // Count events per bucket
  const counts = new Array(buckets.length).fill(0);

  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (ts < start || ts > end) continue;

    // Binary-search-like: find the bucket this event belongs to
    for (let i = 0; i < buckets.length; i++) {
      if (ts >= buckets[i].start && ts <= buckets[i].end) {
        counts[i]++;
        break;
      }
    }
  }

  return buckets.map((bucket, i) => ({
    timestamp: bucket.label,
    value: counts[i],
  }));
}

/**
 * Returns the start of the bucket containing the given date.
 */
function getBucketStart(date: Date, bucketSize: 'hour' | 'day' | 'week'): Date {
  const d = new Date(date);
  switch (bucketSize) {
    case 'hour':
      d.setMinutes(0, 0, 0);
      return d;
    case 'day':
      return startOfDay(d);
    case 'week': {
      const dayOfWeek = d.getDay(); // 0 = Sunday
      d.setDate(d.getDate() - dayOfWeek);
      return startOfDay(d);
    }
  }
}

/**
 * Returns the start of the next bucket after the given bucket start.
 */
function getNextBucketStart(bucketStart: Date, bucketSize: 'hour' | 'day' | 'week'): Date {
  const d = new Date(bucketStart);
  switch (bucketSize) {
    case 'hour':
      d.setHours(d.getHours() + 1);
      return d;
    case 'day':
      d.setDate(d.getDate() + 1);
      return d;
    case 'week':
      d.setDate(d.getDate() + 7);
      return d;
  }
}
