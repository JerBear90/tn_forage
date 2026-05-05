/**
 * Analytics service for the admin dashboard.
 *
 * Provides page view summaries, session summaries, and active user counts
 * by querying PocketBase analytics collections and applying pure computation
 * utilities for aggregation.
 */

import { pb } from '@/auth/authService';
import type {
  TimeRange,
  PageViewSummary,
  SessionSummary,
  DistributionBucket,
  RankedItem,
} from '@/types/admin-dashboard';
import { groupByTimeBucket, topN, average } from './computations/aggregation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a PocketBase filter string for records within a time range.
 * Uses the given field name for the timestamp comparison.
 */
function timeRangeFilter(timeRange: TimeRange, field: string = 'timestamp'): string {
  const start = timeRange.startDate.toISOString().replace('T', ' ');
  const end = timeRange.endDate.toISOString().replace('T', ' ');
  return `${field} >= "${start}" && ${field} <= "${end}"`;
}

/**
 * Determines the appropriate bucket size for time-series grouping
 * based on the span of the time range.
 */
function getBucketSize(timeRange: TimeRange): 'hour' | 'day' | 'week' {
  const spanMs = timeRange.endDate.getTime() - timeRange.startDate.getTime();
  const spanDays = spanMs / (1000 * 60 * 60 * 24);

  if (spanDays <= 1) return 'hour';
  if (spanDays <= 30) return 'day';
  return 'week';
}

// ---------------------------------------------------------------------------
// Page View Analytics
// ---------------------------------------------------------------------------

/**
 * Fetches page view data for the given time range and returns a summary
 * including total views, time-series data, and top pages.
 *
 * Queries the `analytics_page_views` PocketBase collection.
 *
 * @param timeRange - The time range to query
 * @returns PageViewSummary with totalViews, timeSeriesData, and topPages
 */
export async function getPageViewSummary(timeRange: TimeRange): Promise<PageViewSummary> {
  const filter = timeRangeFilter(timeRange);

  const records = await pb.collection('analytics_page_views').getFullList({
    filter,
    sort: 'timestamp',
  });

  const totalViews = records.length;

  // Build time-series data using groupByTimeBucket
  const events = records.map((r) => ({ timestamp: r.timestamp as string }));
  const bucketSize = getBucketSize(timeRange);
  const timeSeriesData = groupByTimeBucket(events, bucketSize, timeRange);

  // Compute top pages by counting occurrences of each path
  const pageCounts = new Map<string, number>();
  for (const record of records) {
    const path = record.path as string;
    pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
  }

  const pageItems: RankedItem[] = Array.from(pageCounts.entries()).map(
    ([label, count]) => ({ label, count })
  );

  const topPages = topN(pageItems, (item) => item.count, 10);

  return { totalViews, timeSeriesData, topPages };
}

// ---------------------------------------------------------------------------
// Session Analytics
// ---------------------------------------------------------------------------

/** Duration distribution bucket definitions (in seconds) */
const SESSION_DURATION_BUCKETS: Omit<DistributionBucket, 'count'>[] = [
  { label: '0-1 min', min: 0, max: 60 },
  { label: '1-5 min', min: 60, max: 300 },
  { label: '5-15 min', min: 300, max: 900 },
  { label: '15-30 min', min: 900, max: 1800 },
  { label: '30+ min', min: 1800, max: Infinity },
];

/**
 * Fetches session data for the given time range and returns a summary
 * including average duration, duration distribution, and total sessions.
 *
 * Queries the `analytics_sessions` PocketBase collection.
 *
 * @param timeRange - The time range to query
 * @returns SessionSummary with averageDuration, distribution, and totalSessions
 */
export async function getSessionSummary(timeRange: TimeRange): Promise<SessionSummary> {
  const filter = timeRangeFilter(timeRange, 'startedAt');

  const records = await pb.collection('analytics_sessions').getFullList({
    filter,
    sort: 'startedAt',
  });

  const totalSessions = records.length;

  // Extract durations
  const durations = records.map((r) => (r.duration as number) ?? 0);

  // Compute average duration
  const averageDuration = average(durations);

  // Build distribution buckets
  const distribution: DistributionBucket[] = SESSION_DURATION_BUCKETS.map((bucket) => ({
    ...bucket,
    count: 0,
  }));

  for (const duration of durations) {
    for (const bucket of distribution) {
      if (duration >= bucket.min && (bucket.max === Infinity ? true : duration < bucket.max)) {
        bucket.count++;
        break;
      }
    }
  }

  return { averageDuration, distribution, totalSessions };
}

// ---------------------------------------------------------------------------
// Active Users
// ---------------------------------------------------------------------------

/**
 * Returns the count of distinct active users in the last 5 minutes.
 *
 * Queries the `analytics_page_views` collection for records with a timestamp
 * within the last 5 minutes and counts distinct userIds.
 *
 * @returns The number of currently active users
 */
export async function getActiveUserCount(): Promise<number> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const filter = `timestamp >= "${fiveMinutesAgo.toISOString().replace('T', ' ')}"`;

  const records = await pb.collection('analytics_page_views').getFullList({
    filter,
  });

  // Count distinct userIds (exclude records without userId)
  const uniqueUsers = new Set<string>();
  for (const record of records) {
    const userId = record.userId as string | undefined;
    if (userId) {
      uniqueUsers.add(userId);
    }
  }

  return uniqueUsers.size;
}
