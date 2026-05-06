/**
 * Error service for the admin dashboard.
 *
 * Provides error log queries with pagination, error summaries with
 * time-series data and top error pages, and resolved toggle functionality.
 */

import { pb } from '@/auth/authService';
import type {
  TimeRange,
  ErrorLogEntry,
  TimeSeriesPoint,
  RankedItem,
} from '@/types/admin-dashboard';
import { groupByTimeBucket, topN } from './computations/aggregation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Paginated result set for error logs */
export interface ErrorLogResult {
  items: ErrorLogEntry[];
  totalItems: number;
  totalPages: number;
}

/** Summary of errors for a given time range */
export interface ErrorSummary {
  totalErrors: number;
  timeSeriesData: TimeSeriesPoint[];
  topErrorPages: RankedItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a PocketBase filter string for records within a time range.
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
// Error Log Queries
// ---------------------------------------------------------------------------

/**
 * Fetches paginated error logs for the given time range.
 *
 * Returns errors sorted by most recent first with pagination metadata.
 *
 * @param timeRange - The time range to query
 * @param page - Page number (1-indexed)
 * @param perPage - Number of items per page
 * @returns ErrorLogResult with items, totalItems, and totalPages
 */
export async function getErrorLogs(
  timeRange: TimeRange,
  page: number = 1,
  perPage: number = 20,
): Promise<ErrorLogResult> {
  const filter = timeRangeFilter(timeRange);

  const result = await pb.collection('analytics_errors').getList(page, perPage, {
    filter,
    sort: '-timestamp',
  });

  const items: ErrorLogEntry[] = result.items.map((record) => ({
    id: record.id,
    message: record.message as string,
    stack: record.stack as string,
    pageUrl: record.pageUrl as string,
    timestamp: record.timestamp as string,
    browser: record.browser as string,
    userId: record.userId as string | undefined,
    resolved: record.resolved as boolean | undefined,
  }));

  return {
    items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}

// ---------------------------------------------------------------------------
// Error Summary
// ---------------------------------------------------------------------------

/**
 * Fetches error summary data for the given time range including total count,
 * time-series frequency data, and top error pages.
 *
 * @param timeRange - The time range to query
 * @returns ErrorSummary with totalErrors, timeSeriesData, and topErrorPages
 */
export async function getErrorSummary(timeRange: TimeRange): Promise<ErrorSummary> {
  const filter = timeRangeFilter(timeRange);

  const records = await pb.collection('analytics_errors').getFullList({
    filter,
    sort: 'timestamp',
  });

  const totalErrors = records.length;

  // Build time-series data using groupByTimeBucket
  const events = records.map((r) => ({ timestamp: r.timestamp as string }));
  const bucketSize = getBucketSize(timeRange);
  const timeSeriesData = groupByTimeBucket(events, bucketSize, timeRange);

  // Compute top error pages by counting occurrences of each pageUrl
  const pageCounts = new Map<string, number>();
  for (const record of records) {
    const pageUrl = record.pageUrl as string;
    pageCounts.set(pageUrl, (pageCounts.get(pageUrl) ?? 0) + 1);
  }

  const pageItems: RankedItem[] = Array.from(pageCounts.entries()).map(
    ([label, count]) => ({ label, count }),
  );

  const topErrorPages = topN(pageItems, (item) => item.count, 10);

  return { totalErrors, timeSeriesData, topErrorPages };
}

// ---------------------------------------------------------------------------
// Toggle Resolved
// ---------------------------------------------------------------------------

/**
 * Toggles the resolved status of an error log entry.
 *
 * @param id - The PocketBase record ID of the error
 * @param resolved - The new resolved status
 */
export async function toggleErrorResolved(id: string, resolved: boolean): Promise<void> {
  await pb.collection('analytics_errors').update(id, { resolved });
}
