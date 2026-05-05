'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimeRange, TimeRangePreset } from '@/types/admin-dashboard';
import ChartWidget from '@/components/admin/dashboard/ChartWidget';
import OverviewCard from '@/components/admin/dashboard/OverviewCard';
import TimeRangeSelector from '@/components/admin/dashboard/TimeRangeSelector';
import { getSearchAnalytics } from '@/services/admin/searchService';
import type { SearchAnalytics } from '@/services/admin/searchService';
import { resolvePreset } from '@/services/admin/computations/timeRange';

export default function SearchAnalyticsPage() {
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('30d');
  const [timeRange, setTimeRange] = useState<TimeRange>(resolvePreset('30d'));
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSearchAnalytics(range);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange, fetchData]);

  const handleTimeRangeChange = (preset: TimeRangePreset, range: TimeRange) => {
    setTimeRangePreset(preset);
    setTimeRange(range);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
            Search Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Understand what users search for and identify content gaps
          </p>
        </div>
        <TimeRangeSelector selected={timeRangePreset} onChange={handleTimeRangeChange} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="Total Searches"
          value={analytics?.totalSearches.toLocaleString() ?? '—'}
          icon={<SearchIcon />}
          loading={loading}
        />
        <OverviewCard
          title="Click-Through Rate"
          value={analytics ? `${analytics.clickThroughRate.toFixed(1)}%` : '—'}
          icon={<ClickIcon />}
          loading={loading}
        />
        <OverviewCard
          title="Content Gaps"
          value={analytics?.contentGaps.length ?? '—'}
          icon={<GapIcon />}
          loading={loading}
        />
      </div>

      {/* Top 20 Searched Terms */}
      <ChartWidget
        title="Top 20 Searched Terms"
        subtitle="Most frequently searched terms in the selected time range"
        loading={loading}
        error={error ?? undefined}
      >
        {analytics && analytics.topTerms.length > 0 ? (
          <TopTermsList terms={analytics.topTerms} />
        ) : (
          <EmptyState message="No search data available for this time range" />
        )}
      </ChartWidget>

      {/* Zero-Result Searches */}
      <ChartWidget
        title="Zero-Result Searches"
        subtitle="Searches that returned no results — potential missing content"
        loading={loading}
        error={error ?? undefined}
      >
        {analytics && analytics.zeroResultSearches.length > 0 ? (
          <ZeroResultsList searches={analytics.zeroResultSearches} />
        ) : (
          <EmptyState message="No zero-result searches found" />
        )}
      </ChartWidget>

      {/* Content Gap Highlights */}
      <ChartWidget
        title="Content Gaps"
        subtitle="Terms that always return zero results — high-priority content to add"
        loading={loading}
        error={error ?? undefined}
      >
        {analytics && analytics.contentGaps.length > 0 ? (
          <ContentGapsList gaps={analytics.contentGaps} />
        ) : (
          <EmptyState message="No content gaps detected" />
        )}
      </ChartWidget>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TopTermsList({ terms }: { terms: Array<{ term: string; count: number }> }) {
  const maxCount = Math.max(...terms.map((t) => t.count), 1);

  return (
    <div className="space-y-2" aria-label="Top searched terms list" role="list">
      {terms.map((item, index) => {
        const barWidth = (item.count / maxCount) * 100;
        return (
          <div
            key={item.term}
            className="flex items-center gap-3"
            role="listitem"
            aria-label={`${item.term}: ${item.count} searches`}
          >
            <span className="w-6 text-right text-xs font-medium text-gray-400 dark:text-gray-500">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
                  {item.term}
                </span>
                <span className="ml-2 shrink-0 text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-brand-charcoal-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-teal transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ZeroResultsList({ searches }: { searches: Array<{ term: string; count: number }> }) {
  return (
    <div className="space-y-2" aria-label="Zero-result searches list" role="list">
      {searches.map((item) => (
        <div
          key={item.term}
          className="flex items-center justify-between rounded-lg border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-2.5"
          role="listitem"
          aria-label={`${item.term}: ${item.count} zero-result searches`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400"
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
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200 truncate">
              {item.term}
            </span>
          </div>
          <span className="ml-2 shrink-0 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
            {item.count}×
          </span>
        </div>
      ))}
    </div>
  );
}

function ContentGapsList({ gaps }: { gaps: string[] }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Content gaps list" role="list">
      {gaps.map((term) => (
        <span
          key={term}
          className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400"
          role="listitem"
          aria-label={`Content gap: ${term}`}
        >
          <svg
            className="mr-1.5 h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          {term}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <svg
        className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ClickIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
      />
    </svg>
  );
}

function GapIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}
