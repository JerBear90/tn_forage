'use client';

import { useState, useCallback } from 'react';
import ChartWidget from './ChartWidget';
import type { TimeRange } from '@/types/admin-dashboard';
import { pb } from '@/auth/authService';
import { generateInsights } from '@/services/admin/computations/insights';
import type { Insight } from '@/services/admin/computations/insights';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InsightsPanelProps {
  timeRange: TimeRange;
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
 * Fetches feedback data grouped by page for the given time range.
 */
async function fetchFeedbackByPage(timeRange: TimeRange): Promise<Map<string, number[]>> {
  const filter = timeRangeFilter(timeRange);
  const records = await pb.collection('analytics_feedback').getFullList({
    filter,
    fields: 'pageUrl,rating',
  });

  const feedbackByPage = new Map<string, number[]>();
  for (const record of records) {
    const page = (record.pageUrl as string) ?? '';
    const rating = record.rating as number;
    if (!feedbackByPage.has(page)) {
      feedbackByPage.set(page, []);
    }
    feedbackByPage.get(page)!.push(rating);
  }

  return feedbackByPage;
}

/**
 * Fetches error counts grouped by page for the given time range.
 */
async function fetchErrorCountByPage(timeRange: TimeRange): Promise<Map<string, number>> {
  const filter = timeRangeFilter(timeRange);
  const records = await pb.collection('analytics_errors').getFullList({
    filter,
    fields: 'pageUrl',
  });

  const errorCountByPage = new Map<string, number>();
  for (const record of records) {
    const page = (record.pageUrl as string) ?? '';
    errorCountByPage.set(page, (errorCountByPage.get(page) ?? 0) + 1);
  }

  return errorCountByPage;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InsightTypeIcon({ type }: { type: Insight['type'] }) {
  if (type === 'low_rating') {
    return (
      <svg
        className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function InsightItem({ insight }: { insight: Insight }) {
  const typeLabel = insight.type === 'low_rating' ? 'Low Rating' : 'High Errors';
  const valueLabel =
    insight.type === 'low_rating'
      ? `Avg: ${insight.value.toFixed(1)} ★`
      : `${insight.value} errors`;

  return (
    <li className="flex items-center gap-3 p-3 md:p-4 border-b border-brand-charcoal/5 dark:border-brand-sand/5 last:border-b-0">
      <InsightTypeIcon type={insight.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
          {insight.page}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {typeLabel}
        </p>
      </div>
      <span
        className={`text-sm font-semibold shrink-0 ${
          insight.type === 'low_rating'
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400'
        }`}
        aria-label={`${typeLabel}: ${valueLabel}`}
      >
        {valueLabel}
      </span>
    </li>
  );
}

function PositiveStatus() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      aria-label="No issues detected"
    >
      <svg
        className="h-10 w-10 text-brand-teal mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
        No issues detected
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        All pages are performing well within expected thresholds.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function InsightsPanel({ timeRange }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [feedbackByPage, errorCountByPage] = await Promise.all([
        fetchFeedbackByPage(timeRange),
        fetchErrorCountByPage(timeRange),
      ]);
      const result = generateInsights(feedbackByPage, errorCountByPage);
      setInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Initial load
  useState(() => {
    fetchData();
  });

  // Re-fetch when timeRange changes
  const [prevTimeRange, setPrevTimeRange] = useState(timeRange);
  if (timeRange !== prevTimeRange) {
    setPrevTimeRange(timeRange);
    fetchData();
  }

  return (
    <ChartWidget
      title="Improvement Insights"
      subtitle="Pages needing attention based on feedback and error data"
      loading={loading}
      error={error}
    >
      {!loading && !error && (
        insights.length === 0 ? (
          <PositiveStatus />
        ) : (
          <ul
            className="divide-y divide-brand-charcoal/5 dark:divide-brand-sand/5"
            aria-label="Improvement insights list"
          >
            {insights.map((insight) => (
              <InsightItem
                key={`${insight.type}-${insight.page}`}
                insight={insight}
              />
            ))}
          </ul>
        )
      )}
    </ChartWidget>
  );
}
