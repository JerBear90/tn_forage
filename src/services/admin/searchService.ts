/**
 * Search analytics service for the admin dashboard.
 *
 * Provides search query aggregation by querying the PocketBase
 * `analytics_search_queries` collection and applying pure computation
 * utilities for top terms, zero-result detection, CTR, and content gaps.
 */

import { pb } from '@/auth/authService';
import type { TimeRange } from '@/types/admin-dashboard';
import {
  computeTopTerms,
  computeZeroResultSearches,
  computeClickThroughRate,
  identifyContentGaps,
} from './computations/search';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchAnalytics {
  topTerms: Array<{ term: string; count: number }>;
  zeroResultSearches: Array<{ term: string; count: number }>;
  clickThroughRate: number;
  contentGaps: string[];
  totalSearches: number;
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

// ---------------------------------------------------------------------------
// Search Analytics
// ---------------------------------------------------------------------------

/**
 * Fetches search analytics for the given time range.
 *
 * Queries the `analytics_search_queries` collection and computes:
 * - Top 20 searched terms
 * - Zero-result searches
 * - Click-through rate
 * - Content gaps (terms that always return zero results)
 * - Total search count
 *
 * @param timeRange - The time range to query
 * @returns SearchAnalytics with aggregated search data
 */
export async function getSearchAnalytics(timeRange: TimeRange): Promise<SearchAnalytics> {
  const filter = timeRangeFilter(timeRange);

  const records = await pb.collection('analytics_search_queries').getFullList({
    filter,
    sort: '-timestamp',
  });

  // Map PocketBase records to typed query objects
  const queries = records.map((record) => ({
    term: record.term as string,
    resultsCount: record.resultsCount as number,
    clickedResult: record.clickedResult as boolean,
  }));

  const topTerms = computeTopTerms(queries, 20);
  const zeroResultSearches = computeZeroResultSearches(queries);
  const clickThroughRate = computeClickThroughRate(queries);
  const contentGaps = identifyContentGaps(queries);

  return {
    topTerms,
    zeroResultSearches,
    clickThroughRate,
    contentGaps,
    totalSearches: queries.length,
  };
}
