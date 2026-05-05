'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  DashboardHeader,
  TimeRangeSelector,
  OverviewCard,
  ChartWidget,
} from '@/components/admin/dashboard';
import {
  getPageViewSummary,
  getSessionSummary,
  getActiveUserCount,
} from '@/services/admin/analyticsService';
import { getActiveAlerts } from '@/services/admin/alertService';
import { exportData } from '@/services/admin/exportService';
import type {
  TimeRange,
  TimeRangePreset,
  PageViewSummary,
  SessionSummary,
  AnomalyAlert,
} from '@/types/admin-dashboard';
import { CHART_COLORS } from '@/types/admin-dashboard';
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a preset into a concrete TimeRange */
function resolvePreset(preset: TimeRangePreset): TimeRange {
  const now = new Date();
  const end = new Date(now);
  let start: Date;
  let label: string;

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      label = 'Today';
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = '7 Days';
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = '30 Days';
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      label = '90 Days';
      break;
    case 'custom':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = 'Custom';
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = '7 Days';
  }

  return { label, startDate: start, endDate: end };
}

/** Fetch error count for a given time range from analytics_errors collection */
async function getErrorCount(timeRange: TimeRange): Promise<number> {
  const start = timeRange.startDate.toISOString().replace('T', ' ');
  const end = timeRange.endDate.toISOString().replace('T', ' ');
  const filter = `timestamp >= "${start}" && timestamp <= "${end}"`;

  try {
    const result = await pb.collection('analytics_errors').getList(1, 1, {
      filter,
    });
    return result.totalItems;
  } catch {
    return 0;
  }
}

/** Fetch the count of users who have opted out of analytics */
async function getAnalyticsOptOutCount(): Promise<number> {
  try {
    const result = await pb.collection('users').getList(1, 1, {
      filter: 'analyticsOptOut = true',
    });
    return result.totalItems;
  } catch {
    return 0;
  }
}

/** Format seconds into a human-readable duration string */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PageViewIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function ActiveUsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SessionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  // Time range state shared across all widgets
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('7d');
  const [timeRange, setTimeRange] = useState<TimeRange>(resolvePreset('7d'));

  // Data states
  const [pageViewSummary, setPageViewSummary] = useState<PageViewSummary | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);

  // Alert banner state
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);

  // Analytics opt-out count
  const [optOutCount, setOptOutCount] = useState<number>(0);

  // Export states
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Loading states
  const [loadingPageViews, setLoadingPageViews] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState(true);

  // Error states
  const [pageViewsError, setPageViewsError] = useState<string | undefined>();
  const [sessionsError, setSessionsError] = useState<string | undefined>();

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle time range change
  const handleTimeRangeChange = useCallback((preset: TimeRangePreset, range: TimeRange) => {
    setTimeRangePreset(preset);
    setTimeRange(range);
  }, []);

  // Fetch active users (polled every 30 seconds)
  const fetchActiveUsers = useCallback(async () => {
    try {
      setLoadingActiveUsers(true);
      const count = await getActiveUserCount();
      setActiveUsers(count);
    } catch {
      // Silently handle — active users will show last known value
    } finally {
      setLoadingActiveUsers(false);
    }
  }, []);

  // Handle export button click
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    setExportError(null);

    try {
      const result = await exportData({
        format: 'json',
        timeRange,
        sections: ['pageViews', 'sessions', 'errors', 'feedback'],
        includeOptOutDisclaimer: true,
      });

      // Trigger browser download
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }, [timeRange]);

  // Fetch all data when time range changes
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      // Fetch page views
      setLoadingPageViews(true);
      setPageViewsError(undefined);
      try {
        const pvSummary = await getPageViewSummary(timeRange);
        if (!cancelled) setPageViewSummary(pvSummary);
      } catch {
        if (!cancelled) setPageViewsError('Failed to load page view data');
      } finally {
        if (!cancelled) setLoadingPageViews(false);
      }

      // Fetch sessions
      setLoadingSessions(true);
      setSessionsError(undefined);
      try {
        const sSummary = await getSessionSummary(timeRange);
        if (!cancelled) setSessionSummary(sSummary);
      } catch {
        if (!cancelled) setSessionsError('Failed to load session data');
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }

      // Fetch error count
      setLoadingErrors(true);
      try {
        const count = await getErrorCount(timeRange);
        if (!cancelled) setErrorCount(count);
      } catch {
        if (!cancelled) setErrorCount(0);
      } finally {
        if (!cancelled) setLoadingErrors(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  // Fetch active users on mount and set up 30-second polling
  useEffect(() => {
    fetchActiveUsers();

    // Fetch analytics opt-out count
    getAnalyticsOptOutCount()
      .then((count) => setOptOutCount(count))
      .catch(() => setOptOutCount(0));

    // Also fetch active alerts for the banner
    getActiveAlerts()
      .then((alerts) => setAnomalyAlerts(alerts))
      .catch(() => setAnomalyAlerts([]));

    pollingRef.current = setInterval(() => {
      fetchActiveUsers();
      // Refresh alerts on each polling cycle
      getActiveAlerts()
        .then((alerts) => setAnomalyAlerts(alerts))
        .catch(() => {});
    }, 30_000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchActiveUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Analytics Dashboard"
        onExport={handleExport}
        exportLoading={exportLoading}
        exportError={exportError}
        onRetryExport={handleExport}
      />

      {/* Alert Banner — shown when active anomalies exist */}
      {anomalyAlerts.length > 0 && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          role="alert"
          aria-label="Active anomaly alerts"
        >
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                {anomalyAlerts.length} Active {anomalyAlerts.length === 1 ? 'Alert' : 'Alerts'}
              </h3>
              <ul className="mt-1 space-y-1">
                {anomalyAlerts.slice(0, 3).map((alert) => (
                  <li key={alert.id} className="text-sm text-red-700 dark:text-red-400">
                    <span className={`inline-block mr-1.5 rounded px-1.5 py-0.5 text-xs font-medium ${
                      alert.severity === 'critical'
                        ? 'bg-red-200 text-red-900 dark:bg-red-800/50 dark:text-red-200'
                        : 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800/50 dark:text-yellow-200'
                    }`}>
                      {alert.severity}
                    </span>
                    {alert.message}
                  </li>
                ))}
                {anomalyAlerts.length > 3 && (
                  <li className="text-sm text-red-600 dark:text-red-400">
                    +{anomalyAlerts.length - 3} more alerts
                  </li>
                )}
              </ul>
              <a
                href="/admin/dashboard/alerts"
                className="mt-2 inline-block min-h-[44px] min-w-[44px] rounded-md px-3 py-2 text-sm font-medium text-red-700 hover:text-red-900 hover:underline dark:text-red-300 dark:hover:text-red-100"
                aria-label="View all active alerts"
              >
                View Alerts →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <TimeRangeSelector selected={timeRangePreset} onChange={handleTimeRangeChange} />

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { href: '/admin/dashboard/blog', icon: '📝', label: 'New Blog Post' },
          { href: '/admin/dashboard/notifications', icon: '🔔', label: 'Send Notification' },
          { href: '/admin/dashboard/ai', icon: '🤖', label: 'Generate Content' },
          { href: '/admin/dashboard/releases', icon: '📋', label: 'Add Release' },
          { href: '/admin/dashboard/settings', icon: '⚙️', label: 'Settings' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-4 text-center hover:border-brand-teal/40 hover:bg-brand-teal/5 dark:hover:bg-brand-teal/10 transition-colors min-h-[44px]"
          >
            <span className="text-2xl" aria-hidden="true">{action.icon}</span>
            <span className="text-xs font-medium text-brand-charcoal dark:text-brand-sand">{action.label}</span>
          </Link>
        ))}
      </section>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          title="Total Page Views"
          value={loadingPageViews ? '—' : (pageViewSummary?.totalViews.toLocaleString() ?? '0')}
          icon={<PageViewIcon />}
          loading={loadingPageViews}
        />
        <OverviewCard
          title="Active Users"
          value={loadingActiveUsers ? '—' : activeUsers}
          icon={<ActiveUsersIcon />}
          loading={loadingActiveUsers}
        />
        <OverviewCard
          title="Avg Session Duration"
          value={loadingSessions ? '—' : formatDuration(sessionSummary?.averageDuration ?? 0)}
          icon={<SessionIcon />}
          loading={loadingSessions}
        />
        <OverviewCard
          title="Error Count"
          value={loadingErrors ? '—' : errorCount.toLocaleString()}
          icon={<ErrorIcon />}
          loading={loadingErrors}
        />
      </div>

      {/* Analytics opt-out info note */}
      {optOutCount > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400" aria-label="Analytics opt-out count">
          {optOutCount} {optOutCount === 1 ? 'user has' : 'users have'} opted out of analytics
        </p>
      )}

      {/* Page Views Chart */}
      <ChartWidget
        title="Page Views Over Time"
        subtitle={`Showing data for the last ${timeRange.label.toLowerCase()}`}
        loading={loadingPageViews}
        error={pageViewsError}
      >
        {pageViewSummary && pageViewSummary.timeSeriesData.length > 0 ? (
          <div className="h-72" role="img" aria-label="Line chart showing page views over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pageViewSummary.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                  tickFormatter={(value: string) => {
                    const date = new Date(value);
                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.text }} />
                <Tooltip
                  labelFormatter={(label) => {
                    const date = new Date(String(label));
                    return date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Page Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </ChartWidget>

      {/* Session Duration Distribution Chart */}
      <ChartWidget
        title="Session Duration Distribution"
        subtitle="Distribution of session lengths"
        loading={loadingSessions}
        error={sessionsError}
      >
        {sessionSummary && sessionSummary.distribution.length > 0 ? (
          <div className="h-72" role="img" aria-label="Bar chart showing session duration distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionSummary.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: CHART_COLORS.text }}
                />
                <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.text }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                  name="Sessions"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </ChartWidget>
    </div>
  );
}
