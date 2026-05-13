'use client';

import { useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartWidget from './ChartWidget';
import type { TimeRange } from '@/types/admin-dashboard';
import { CHART_COLORS } from '@/types/admin-dashboard';
import {
  getFeedbackSummary,
  getFeedbackList,
} from '@/services/admin/feedbackService';
import type {
  FeedbackSummary,
  FeedbackListResult,
  FeedbackRecord,
} from '@/services/admin/feedbackService';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedbackPanelProps {
  timeRange: TimeRange;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-5 w-5'}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function AverageRatingDisplay({ rating, totalCount }: { rating: number; totalCount: number }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Average rating: ${rating.toFixed(1)} out of 5 stars from ${totalCount} reviews`}>
      <div className="flex items-center gap-1.5">
        <span className="text-3xl font-bold text-brand-charcoal dark:text-brand-sand">
          {rating.toFixed(1)}
        </span>
        <StarIcon className="h-7 w-7 text-yellow-500" />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        from {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  );
}

function RatingDistributionChart({ data }: { data: { rating: number; count: number }[] }) {
  const chartData = data.map((d) => ({
    name: `${d.rating} ★`,
    count: d.count,
  }));

  return (
    <div className="h-48" aria-label="Rating distribution chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: CHART_COLORS.text }}
            aria-label="Rating axis"
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_COLORS.text }}
            allowDecimals={false}
            aria-label="Count axis"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg, #fff)',
              borderColor: CHART_COLORS.grid,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
            name="Feedback count"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingFilter({
  selected,
  onChange,
}: {
  selected: number | null;
  onChange: (rating: number | null) => void;
}) {
  const ratings = [null, 1, 2, 3, 4, 5] as const;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter feedback by star rating">
      {ratings.map((rating) => (
        <button
          key={rating ?? 'all'}
          type="button"
          onClick={() => onChange(rating)}
          aria-label={rating === null ? 'Show all ratings' : `Filter by ${rating} star${rating > 1 ? 's' : ''}`}
          aria-pressed={selected === rating}
          className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
            selected === rating
              ? 'bg-brand-teal text-white dark:bg-brand-teal dark:text-white'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {rating === null ? 'All' : `${rating} ★`}
        </button>
      ))}
    </div>
  );
}

function FeedbackEntry({ record }: { record: FeedbackRecord }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <li className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 last:border-b-0 p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Star rating */}
          <div className="flex items-center gap-0.5" aria-label={`Rating: ${record.rating} out of 5 stars`}>
            {stars.map((star) => (
              <StarIcon
                key={star}
                className={`h-4 w-4 ${
                  star <= record.rating
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Message */}
          {record.message && (
            <p className="mt-1.5 text-sm text-brand-charcoal dark:text-brand-sand">
              {record.message}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <time dateTime={record.timestamp}>
              {new Date(record.timestamp).toLocaleString()}
            </time>
            {record.userId && (
              <span className="truncate max-w-[200px]">
                User: {record.userId}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Feedback list pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-brand-charcoal dark:text-brand-sand disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        ← Prev
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-brand-charcoal dark:text-brand-sand disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        Next →
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FeedbackPanel({ timeRange }: FeedbackPanelProps) {
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [listResult, setListResult] = useState<FeedbackListResult | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const perPage = 10;

  // Fetch data
  const fetchData = useCallback(
    async (currentPage: number, currentFilter: number | null) => {
      setLoading(true);
      setError(undefined);
      try {
        const [summaryData, listData] = await Promise.all([
          getFeedbackSummary(timeRange),
          getFeedbackList(
            timeRange,
            currentFilter ?? undefined,
            currentPage,
            perPage,
          ),
        ]);
        setSummary(summaryData);
        setListResult(listData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feedback data');
      } finally {
        setLoading(false);
      }
    },
    [timeRange],
  );

  // Initial load
  useState(() => {
    fetchData(page, ratingFilter);
  });

  // Re-fetch when timeRange changes
  const [prevTimeRange, setPrevTimeRange] = useState(timeRange);
  if (timeRange !== prevTimeRange) {
    setPrevTimeRange(timeRange);
    setPage(1);
    setRatingFilter(null);
    fetchData(1, null);
  }

  const handleRatingFilterChange = (rating: number | null) => {
    setRatingFilter(rating);
    setPage(1);
    fetchData(1, rating);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, ratingFilter);
  };

  return (
    <div className="space-y-6">
      {/* Average Rating & Distribution */}
      <ChartWidget
        title="Feedback Overview"
        subtitle={summary ? `${summary.totalCount} total feedback entries` : undefined}
        loading={loading}
        error={error}
      >
        {summary && (
          <div className="space-y-4">
            <AverageRatingDisplay
              rating={summary.averageRating}
              totalCount={summary.totalCount}
            />
            {summary.distribution.length > 0 && (
              <RatingDistributionChart data={summary.distribution} />
            )}
          </div>
        )}
      </ChartWidget>

      {/* Filterable Feedback List */}
      <ChartWidget
        title="Feedback Entries"
        subtitle={listResult ? `${listResult.totalItems} entries` : undefined}
        loading={loading}
        error={error}
      >
        {listResult && (
          <div className="space-y-4">
            <RatingFilter
              selected={ratingFilter}
              onChange={handleRatingFilterChange}
            />

            {listResult.items.length > 0 ? (
              <>
                <ul
                  className="divide-y divide-brand-charcoal/5 dark:divide-brand-sand/5"
                  aria-label="Feedback entries list"
                >
                  {listResult.items.map((record) => (
                    <FeedbackEntry key={record.id} record={record} />
                  ))}
                </ul>
                <Pagination
                  page={page}
                  totalPages={listResult.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                No feedback entries found for the selected filter.
              </p>
            )}
          </div>
        )}
      </ChartWidget>
    </div>
  );
}
