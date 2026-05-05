'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TimeRange, TimeRangePreset, RetentionMetrics } from '@/types/admin-dashboard';
import { CHART_COLORS } from '@/types/admin-dashboard';
import ChartWidget from '@/components/admin/dashboard/ChartWidget';
import OverviewCard from '@/components/admin/dashboard/OverviewCard';
import TimeRangeSelector from '@/components/admin/dashboard/TimeRangeSelector';
import { getRetentionMetrics } from '@/services/admin/retentionService';
import { resolvePreset } from '@/services/admin/computations/timeRange';

export default function RetentionPage() {
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('30d');
  const [timeRange, setTimeRange] = useState<TimeRange>(resolvePreset('30d'));
  const [metrics, setMetrics] = useState<RetentionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRetentionMetrics(range);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load retention metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics(timeRange);
  }, [timeRange, fetchMetrics]);

  const handleTimeRangeChange = (preset: TimeRangePreset, range: TimeRange) => {
    setTimeRangePreset(preset);
    setTimeRange(range);
  };

  // Build trend data for the chart from cohort table
  const trendData = metrics?.cohortTable.map((row) => ({
    week: row.cohortWeek,
    users: row.totalUsers,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
            Retention Metrics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track user engagement with DAU, WAU, MAU, churn, and cohort retention
          </p>
        </div>
        <TimeRangeSelector selected={timeRangePreset} onChange={handleTimeRangeChange} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="Daily Active Users (DAU)"
          value={metrics?.dau ?? 0}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <OverviewCard
          title="Weekly Active Users (WAU)"
          value={metrics?.wau ?? 0}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <OverviewCard
          title="Monthly Active Users (MAU)"
          value={metrics?.mau ?? 0}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {/* Churn and Return Rate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OverviewCard
          title="Churn Rate"
          value={metrics ? `${(metrics.churnRate * 100).toFixed(1)}%` : '0%'}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
        <OverviewCard
          title="Return Rate"
          value={metrics ? `${(metrics.returnRate * 100).toFixed(1)}%` : '0%'}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          }
        />
      </div>

      {/* Trend Chart */}
      <ChartWidget
        title="User Cohort Sizes Over Time"
        subtitle="Number of users per signup week cohort"
        loading={loading}
        error={error ?? undefined}
      >
        {trendData.length > 0 ? (
          <div className="h-72" aria-label="User cohort trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  stroke={CHART_COLORS.text}
                  aria-label="Week"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke={CHART_COLORS.text}
                  aria-label="Users"
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="Cohort Users"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </ChartWidget>

      {/* Cohort Retention Table */}
      <ChartWidget
        title="Cohort Retention Table"
        subtitle="Percentage of users from each signup week still active in subsequent weeks"
        loading={loading}
        error={error ?? undefined}
      >
        {metrics && metrics.cohortTable.length > 0 ? (
          <div className="overflow-x-auto" aria-label="Cohort retention table">
            <table className="w-full text-sm text-left" role="table">
              <thead>
                <tr className="border-b border-brand-charcoal/10 dark:border-brand-sand/10">
                  <th
                    scope="col"
                    className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand"
                  >
                    Cohort Week
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand"
                  >
                    Users
                  </th>
                  {Array.from({ length: metrics.cohortTable[0]?.retentionByWeek.length ?? 0 }, (_, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="px-3 py-2 font-semibold text-brand-charcoal dark:text-brand-sand text-center"
                    >
                      Wk {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.cohortTable.map((row) => (
                  <tr
                    key={row.cohortWeek}
                    className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal-700/50"
                  >
                    <td className="px-3 py-2 text-brand-charcoal dark:text-brand-sand whitespace-nowrap">
                      {row.cohortWeek}
                    </td>
                    <td className="px-3 py-2 text-brand-charcoal dark:text-brand-sand">
                      {row.totalUsers}
                    </td>
                    {row.retentionByWeek.map((pct, i) => (
                      <td
                        key={i}
                        className={`px-3 py-2 text-center ${getRetentionColor(pct)}`}
                      >
                        {pct.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </ChartWidget>
    </div>
  );
}

/**
 * Returns a Tailwind color class based on retention percentage.
 * Higher retention = greener, lower = more red.
 */
function getRetentionColor(pct: number): string {
  if (pct >= 60) return 'text-green-600 dark:text-green-400 font-medium';
  if (pct >= 40) return 'text-brand-teal dark:text-brand-teal';
  if (pct >= 20) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}
