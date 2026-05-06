/**
 * Feedback service for the admin dashboard.
 *
 * Provides feedback summary queries (average rating, distribution, total count)
 * and paginated feedback list retrieval with optional rating filter.
 */

import { pb } from '@/auth/authService';
import type { TimeRange } from '@/types/admin-dashboard';
import { computeAverageRating, computeRatingDistribution } from './computations/feedback';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single feedback record from PocketBase */
export interface FeedbackRecord {
  id: string;
  rating: number;
  message: string;
  pageUrl: string;
  timestamp: string;
  userId: string;
  deviceInfo?: Record<string, unknown>;
}

/** Summary of feedback for a given time range */
export interface FeedbackSummary {
  averageRating: number;
  distribution: { rating: number; count: number }[];
  totalCount: number;
}

/** Paginated result set for feedback records */
export interface FeedbackListResult {
  items: FeedbackRecord[];
  totalItems: number;
  totalPages: number;
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
// Feedback Summary
// ---------------------------------------------------------------------------

/**
 * Fetches feedback summary data for the given time range including
 * average rating, rating distribution, and total count.
 *
 * @param timeRange - The time range to query
 * @returns FeedbackSummary with averageRating, distribution, and totalCount
 */
export async function getFeedbackSummary(timeRange: TimeRange): Promise<FeedbackSummary> {
  const filter = timeRangeFilter(timeRange);

  const records = await pb.collection('analytics_feedback').getFullList({
    filter,
    sort: '-timestamp',
  });

  const ratings = records.map((r) => r.rating as number);
  const averageRating = computeAverageRating(ratings);
  const distribution = computeRatingDistribution(ratings);
  const totalCount = records.length;

  return { averageRating, distribution, totalCount };
}

// ---------------------------------------------------------------------------
// Feedback List
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated list of feedback records for the given time range,
 * optionally filtered by star rating.
 *
 * @param timeRange - The time range to query
 * @param ratingFilter - Optional rating to filter by (1–5), undefined returns all
 * @param page - Page number (1-indexed)
 * @param perPage - Number of items per page
 * @returns FeedbackListResult with items, totalItems, and totalPages
 */
export async function getFeedbackList(
  timeRange: TimeRange,
  ratingFilter?: number,
  page: number = 1,
  perPage: number = 20,
): Promise<FeedbackListResult> {
  let filter = timeRangeFilter(timeRange);

  if (ratingFilter !== undefined && ratingFilter >= 1 && ratingFilter <= 5) {
    filter += ` && rating = ${ratingFilter}`;
  }

  const result = await pb.collection('analytics_feedback').getList(page, perPage, {
    filter,
    sort: '-timestamp',
  });

  const items: FeedbackRecord[] = result.items.map((record) => ({
    id: record.id,
    rating: record.rating as number,
    message: (record.message as string) ?? '',
    pageUrl: (record.pageUrl as string) ?? '',
    timestamp: record.timestamp as string,
    userId: (record.userId as string) ?? '',
    deviceInfo: record.deviceInfo as Record<string, unknown> | undefined,
  }));

  return {
    items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}
