'use client';

import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ChartWidget from './ChartWidget';
import type {
  TimeRange,
  ErrorLogEntry,
  TimeSeriesPoint,
  RankedItem,
} from '@/types/admin-dashboard';
import { CHART_COLORS } from '@/types/admin-dashboard';
import {
  getErrorLogs,
  getErrorSummary,
  toggleErrorResolved,
} from '@/services/admin/errorService';
import type { ErrorLogResult, ErrorSummary } from '@/services/admin/errorService';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ErrorLogPanelProps {
  timeRange: TimeRange;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ErrorFrequencyChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <div className="h-64" aria-label="Error frequency over time chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.grid}
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 11, fill: CHART_COLORS.text }}
            tickFormatter={(val: string) => {
              const d = new Date(val);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
            aria-label="Time axis"
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_COLORS.text }}
            allowDecimals={false}
            aria-label="Error count axis"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg, #fff)',
              borderColor: CHART_COLORS.grid,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name="Errors"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpandableStackTrace({ stack }: { stack: string }) {
  return (
    <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-gray-100 dark:bg-brand-charcoal-900 p-3 text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words">
      {stack}
    </pre>
  );
}

function ResolvedToggle({
  id,
  resolved,
  onToggle,
}: {
  id: string;
  resolved: boolean;
  onToggle: (id: string, resolved: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id, !resolved)}
      aria-label={resolved ? 'Mark as unresolved' : 'Mark as resolved'}
      className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
        resolved
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {resolved ? (
        <>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Resolved
        </>
      ) : (
        <>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
          Open
        </>
      )}
    </button>
  );
}

function ErrorRow({
  error,
  expanded,
  onToggleExpand,
  onToggleResolved,
}: {
  error: ErrorLogEntry;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleResolved: (id: string, resolved: boolean) => void;
}) {
  return (
    <li className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 last:border-b-0">
      <div className="flex items-start gap-3 p-3 md:p-4">
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleExpand(error.id)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} error details: ${error.message}`}
            className="min-h-[44px] w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded"
          >
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
              {error.message}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{error.pageUrl}</span>
              <span>{new Date(error.timestamp).toLocaleString()}</span>
              <span className="truncate max-w-[150px]">{error.browser}</span>
            </div>
          </button>
          {expanded && error.stack && <ExpandableStackTrace stack={error.stack} />}
        </div>
        <div className="shrink-0">
          <ResolvedToggle
            id={error.id}
            resolved={error.resolved ?? false}
            onToggle={onToggleResolved}
          />
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
    <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Error log pagination">
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

function TopErrorPages({ pages }: { pages: RankedItem[] }) {
  if (pages.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">
        Top Error Pages
      </h4>
      <ul className="space-y-1" aria-label="Pages with most errors">
        {pages.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 py-1"
          >
            <span className="truncate mr-2">{item.label}</span>
            <span className="shrink-0 font-medium text-brand-charcoal dark:text-brand-sand">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ErrorLogPanel({ timeRange }: ErrorLogPanelProps) {
  const [logResult, setLogResult] = useState<ErrorLogResult | null>(null);
  const [summary, setSummary] = useState<ErrorSummary | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const perPage = 10;

  // Fetch data
  const fetchData = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      setError(undefined);
      try {
        const [logs, summaryData] = await Promise.all([
          getErrorLogs(timeRange, currentPage, perPage),
          getErrorSummary(timeRange),
        ]);
        setLogResult(logs);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load error data');
      } finally {
        setLoading(false);
      }
    },
    [timeRange],
  );

  // Initial load and time range changes
  useState(() => {
    fetchData(page);
  });

  // Re-fetch when timeRange changes
  const [prevTimeRange, setPrevTimeRange] = useState(timeRange);
  if (timeRange !== prevTimeRange) {
    setPrevTimeRange(timeRange);
    setPage(1);
    fetchData(1);
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleResolved = async (id: string, resolved: boolean) => {
    try {
      await toggleErrorResolved(id, resolved);
      // Update local state optimistically
      setLogResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === id ? { ...item, resolved } : item,
          ),
        };
      });
    } catch {
      // Refetch on failure to restore correct state
      fetchData(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Frequency Chart */}
      <ChartWidget
        title="Error Frequency"
        subtitle={summary ? `${summary.totalErrors} total errors` : undefined}
        loading={loading}
        error={error}
      >
        {summary && summary.timeSeriesData.length > 0 ? (
          <ErrorFrequencyChart data={summary.timeSeriesData} />
        ) : null}
      </ChartWidget>

      {/* Top Error Pages */}
      {summary && summary.topErrorPages.length > 0 && (
        <ChartWidget title="Top Error Pages" loading={loading} error={error}>
          <TopErrorPages pages={summary.topErrorPages} />
        </ChartWidget>
      )}

      {/* Error Log List */}
      <ChartWidget
        title="Error Logs"
        subtitle={logResult ? `${logResult.totalItems} errors found` : undefined}
        loading={loading}
        error={error}
      >
        {logResult && logResult.items.length > 0 ? (
          <>
            <ul className="divide-y divide-brand-charcoal/5 dark:divide-brand-sand/5" aria-label="Error log entries">
              {logResult.items.map((errorEntry) => (
                <ErrorRow
                  key={errorEntry.id}
                  error={errorEntry}
                  expanded={expandedIds.has(errorEntry.id)}
                  onToggleExpand={handleToggleExpand}
                  onToggleResolved={handleToggleResolved}
                />
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={logResult.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : null}
      </ChartWidget>
    </div>
  );
}
