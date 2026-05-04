/**
 * ForageFlow — Trail Condition Aggregator
 *
 * Aggregates trail condition reports from a 7-day rolling window.
 * Determines the displayed category from the most frequently reported.
 * Maps categories to display colors (green/yellow/red).
 *
 * Requirements: 10.1, 17.8
 * Design Properties: P6, P7
 */

import type { TrailConditionReport, TrailConditionCategory } from '@/types';

/**
 * Color mapping for trail condition categories.
 */
export type ConditionColor = 'green' | 'yellow' | 'red';

/**
 * Maps trail condition categories to display colors.
 *
 * Property P7: Trail condition colors
 * - clear, dry → green
 * - issues, muddy, snowy → yellow
 * - bad-closed → red
 */
export function getCategoryColor(category: TrailConditionCategory): ConditionColor {
  switch (category) {
    case 'clear':
    case 'dry':
      return 'green';
    case 'issues':
    case 'muddy':
    case 'snowy':
      return 'yellow';
    case 'bad-closed':
      return 'red';
  }
}

/**
 * Aggregated trail condition result.
 */
export interface AggregatedCondition {
  /** The most frequently reported category in the 7-day window */
  displayedCategory: TrailConditionCategory | null;
  /** Display color for the category */
  color: ConditionColor | null;
  /** Number of reports in the window */
  reportCount: number;
  /** Timestamp of the most recent report */
  lastReportedAt: string | null;
  /** Whether any data is available */
  hasData: boolean;
}

/**
 * The rolling window duration in milliseconds (7 days).
 */
const ROLLING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Aggregates trail condition reports from the last 7 days.
 *
 * Property P6: Trail condition aggregation from 7-day window
 * - Only reports from the last 7 days are considered
 * - The displayed category is the most frequently reported
 * - If no reports exist within 7 days, returns null category
 *
 * @param reports - All reports for a given trail
 * @param now - Current timestamp (defaults to Date.now(), injectable for testing)
 * @returns Aggregated condition with displayed category and color
 */
export function aggregateTrailConditions(
  reports: TrailConditionReport[],
  now: number = Date.now(),
): AggregatedCondition {
  // Filter to reports within the 7-day rolling window
  const cutoff = now - ROLLING_WINDOW_MS;
  const recentReports = reports.filter(
    (r) => new Date(r.reportedAt).getTime() >= cutoff,
  );

  if (recentReports.length === 0) {
    return {
      displayedCategory: null,
      color: null,
      reportCount: 0,
      lastReportedAt: null,
      hasData: false,
    };
  }

  // Count frequency of each category across all recent reports
  const categoryCounts = new Map<TrailConditionCategory, number>();

  for (const report of recentReports) {
    for (const category of report.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  // Find the most frequently reported category
  let maxCount = 0;
  let displayedCategory: TrailConditionCategory | null = null;

  for (const [category, count] of Array.from(categoryCounts.entries())) {
    if (count > maxCount) {
      maxCount = count;
      displayedCategory = category;
    }
  }

  // Find the most recent report timestamp
  const sortedByDate = [...recentReports].sort(
    (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
  );

  return {
    displayedCategory,
    color: displayedCategory ? getCategoryColor(displayedCategory) : null,
    reportCount: recentReports.length,
    lastReportedAt: sortedByDate[0]?.reportedAt ?? null,
    hasData: true,
  };
}

/**
 * Filters reports for a specific trail.
 */
export function getReportsForTrail(
  allReports: TrailConditionReport[],
  trailId: string,
): TrailConditionReport[] {
  return allReports.filter((r) => r.trailId === trailId);
}
