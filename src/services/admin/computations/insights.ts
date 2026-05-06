/**
 * Pure computation functions for generating improvement insights.
 *
 * Identifies pages with low feedback ratings and high error counts,
 * then combines and sorts them by severity.
 *
 * All functions are pure — no side effects, no PocketBase calls.
 */

import { average, percentile } from './aggregation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** An improvement insight identifying a page that needs attention */
export interface Insight {
  page: string;
  type: 'low_rating' | 'high_errors';
  value: number;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Identifies pages with an average feedback rating below 3.0.
 *
 * Results are sorted by severity (lowest average rating first).
 *
 * @param feedbackByPage - Map of page path to array of ratings for that page
 * @returns Array of Insight objects for pages with average rating < 3.0
 */
export function identifyLowRatingPages(
  feedbackByPage: Map<string, number[]>,
): Insight[] {
  const insights: Insight[] = [];

  feedbackByPage.forEach((ratings, page) => {
    if (ratings.length === 0) return;

    const avg = average(ratings);
    if (avg < 3.0) {
      insights.push({ page, type: 'low_rating', value: avg });
    }
  });

  // Sort by severity: lowest rating first
  insights.sort((a, b) => a.value - b.value);

  return insights;
}

/**
 * Identifies pages with error counts above the 90th percentile.
 *
 * Results are sorted by severity (highest error count first).
 *
 * @param errorCountByPage - Map of page path to error count for that page
 * @param allCounts - Array of all error counts (used to compute the 90th percentile threshold)
 * @returns Array of Insight objects for pages with error count above the 90th percentile
 */
export function identifyHighErrorPages(
  errorCountByPage: Map<string, number>,
  allCounts: number[],
): Insight[] {
  if (allCounts.length === 0) return [];

  const threshold = percentile(allCounts, 90);
  const insights: Insight[] = [];

  errorCountByPage.forEach((count, page) => {
    if (count > threshold) {
      insights.push({ page, type: 'high_errors', value: count });
    }
  });

  // Sort by severity: highest error count first
  insights.sort((a, b) => b.value - a.value);

  return insights;
}

/**
 * Generates a combined list of improvement insights from feedback and error data.
 *
 * Combines low-rating page insights and high-error page insights, sorted by
 * severity (low ratings first sorted ascending, then high errors sorted descending).
 *
 * @param feedbackByPage - Map of page path to array of ratings for that page
 * @param errorCountByPage - Map of page path to error count for that page
 * @returns Combined array of Insight objects sorted by severity
 */
export function generateInsights(
  feedbackByPage: Map<string, number[]>,
  errorCountByPage: Map<string, number>,
): Insight[] {
  const allCounts = Array.from(errorCountByPage.values());

  const lowRatingInsights = identifyLowRatingPages(feedbackByPage);
  const highErrorInsights = identifyHighErrorPages(errorCountByPage, allCounts);

  // Combine: low ratings first (sorted by lowest rating), then high errors (sorted by highest count)
  return [...lowRatingInsights, ...highErrorInsights];
}
