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
import type { TimeRange, TimeRangePreset } from '@/types/admin-dashboard';
import { CHART_COLORS } from '@/types/admin-dashboard';
import ChartWidget from '@/components/admin/dashboard/ChartWidget';
import OverviewCard from '@/components/admin/dashboard/OverviewCard';
import TimeRangeSelector from '@/components/admin/dashboard/TimeRangeSelector';
import { getRevenueMetrics, type RevenueMetrics } from '@/services/admin/revenueService';
import { resolvePreset } from '@/services/admin/computations/timeRange';

export default function RevenuePage() {
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('30d');
  const [timeRange, setTimeRange] = useState<TimeRange>(resolvePreset('30d'));
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRevenueMetrics(range);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue metrics');
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
            Revenue &amp; Membership
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track subscription revenue, conversion rates, and membership churn
          </p>
        </div>
        <TimeRangeSelector selected={timeRangePreset} onChange={handleTimeRangeChange} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="Active Subscribers"
          value={metrics?.activeSubscribers ?? 0}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <OverviewCard
          title="Free Users"
          value={metrics?.freeUsers ?? 0}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <OverviewCard
          title="Monthly Recurring Revenue"
          value={metrics ? formatCurrency(metrics.mrr) : '$0'}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Conversion and Churn */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OverviewCard
          title="Conversion Rate"
          value={metrics ? `${metrics.conversionRate.toFixed(1)}%` : '0%'}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <OverviewCard
          title="Subscription Churn Rate"
          value={metrics ? `${metrics.churnRate.toFixed(1)}%` : '0%'}
          loading={loading}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
      </div>

      {/* MRR Trend Chart */}
      <ChartWidget
        title="MRR Trend"
        subtitle="Monthly Recurring Revenue over time"
        loading={loading}
        error={error ?? undefined}
      >
        {metrics && metrics.mrrTrend.length > 0 ? (
          <div className="h-72" aria-label="Monthly recurring revenue trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics.mrrTrend}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  stroke={CHART_COLORS.text}
                  aria-label="Month"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke={CHART_COLORS.text}
                  tickFormatter={(value) => `$${value}`}
                  aria-label="MRR"
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'MRR']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="MRR"
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

      {/* Stripe Dashboard Link */}
      <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal-800 p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-brand-charcoal dark:text-brand-sand">
              Stripe Dashboard
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              View detailed payment management, invoices, and subscription details
            </p>
          </div>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Stripe dashboard in a new tab"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-brand-teal text-white hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Stripe
          </a>
        </div>
      </div>
    </div>
  );
}
