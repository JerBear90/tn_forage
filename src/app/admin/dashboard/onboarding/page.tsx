'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TimeRange, TimeRangePreset } from '@/types/admin-dashboard';
import { CHART_COLORS } from '@/types/admin-dashboard';
import ChartWidget from '@/components/admin/dashboard/ChartWidget';
import OverviewCard from '@/components/admin/dashboard/OverviewCard';
import TimeRangeSelector from '@/components/admin/dashboard/TimeRangeSelector';
import { getOnboardingMetrics } from '@/services/admin/onboardingService';
import type { OnboardingMetrics } from '@/services/admin/onboardingService';
import { resolvePreset } from '@/services/admin/computations/timeRange';

export default function OnboardingPage() {
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('30d');
  const [timeRange, setTimeRange] = useState<TimeRange>(resolvePreset('30d'));
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOnboardingMetrics(range);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding metrics');
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

  // Prepare chart data
  const chartData = metrics?.milestones.map((m) => ({
    name: m.name,
    completion: Math.round(m.completionPercentage * 10) / 10,
    flagged: m.flagged,
  })) ?? [];

  const flaggedCount = metrics?.milestones.filter((m) => m.flagged).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
            Onboarding Completion
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track how new users progress through key first actions
          </p>
        </div>
        <TimeRangeSelector selected={timeRangePreset} onChange={handleTimeRangeChange} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <OverviewCard
          title="New Users (30 days)"
          value={metrics?.totalNewUsers ?? 0}
          icon={<NewUsersIcon />}
          loading={loading}
        />
        <OverviewCard
          title="Overall Completion"
          value={metrics ? `${metrics.overallCompletionRate.toFixed(1)}%` : '—'}
          icon={<CompletionIcon />}
          loading={loading}
        />
        <OverviewCard
          title="Flagged Milestones"
          value={flaggedCount}
          icon={<FlagIcon />}
          loading={loading}
        />
      </div>

      {/* Completion Rate Chart */}
      <ChartWidget
        title="Milestone Completion Rates"
        subtitle="Percentage of new users completing each onboarding milestone"
        loading={loading}
        error={error ?? undefined}
      >
        {chartData.length > 0 ? (
          <div className="h-72" aria-label="Onboarding milestone completion rate chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke={CHART_COLORS.text}
                  unit="%"
                  aria-label="Completion percentage"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke={CHART_COLORS.text}
                  width={140}
                  aria-label="Milestone"
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Completion']}
                  contentStyle={{
                    backgroundColor: 'var(--brand-sand)',
                    borderColor: CHART_COLORS.grid,
                  }}
                />
                <Bar dataKey="completion" name="Completion Rate" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.flagged ? '#ef4444' : CHART_COLORS.primary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </ChartWidget>

      {/* Milestone Details */}
      <ChartWidget
        title="Milestone Details"
        subtitle="Completion percentages and average time to complete each milestone"
        loading={loading}
        error={error ?? undefined}
      >
        {metrics && metrics.milestones.length > 0 ? (
          <div className="space-y-4" aria-label="Onboarding milestone details" role="list">
            {metrics.milestones.map((milestone) => (
              <MilestoneRow key={milestone.id} milestone={milestone} />
            ))}
          </div>
        ) : (
          <EmptyState message="No onboarding data available for this time range" />
        )}
      </ChartWidget>

      {/* Flagged Milestones */}
      {metrics && flaggedCount > 0 && (
        <ChartWidget
          title="Milestones Needing Attention"
          subtitle="Milestones with less than 30% completion rate"
          loading={loading}
          error={error ?? undefined}
        >
          <div
            className="space-y-3"
            aria-label="Flagged milestones needing attention"
            role="list"
          >
            {metrics.milestones
              .filter((m) => m.flagged)
              .map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-4 py-3"
                  role="listitem"
                  aria-label={`${milestone.name}: ${milestone.completionPercentage.toFixed(1)}% completion, needs attention`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
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
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                        {milestone.name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {milestone.completedCount} of {milestone.totalNewUsers} users completed
                      </p>
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 text-lg font-bold text-red-700 dark:text-red-300">
                    {milestone.completionPercentage.toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </ChartWidget>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MilestoneRowProps {
  milestone: {
    id: string;
    name: string;
    completionPercentage: number;
    averageTimeToComplete: number;
    completedCount: number;
    totalNewUsers: number;
    flagged: boolean;
  };
}

function MilestoneRow({ milestone }: MilestoneRowProps) {
  const barColor = milestone.flagged
    ? 'bg-red-500 dark:bg-red-400'
    : 'bg-brand-teal dark:bg-brand-teal';

  const textColor = milestone.flagged
    ? 'text-red-700 dark:text-red-300'
    : 'text-brand-charcoal dark:text-brand-sand';

  return (
    <div
      className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4"
      role="listitem"
      aria-label={`${milestone.name}: ${milestone.completionPercentage.toFixed(1)}% completion`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${textColor}`}>
            {milestone.name}
          </span>
          {milestone.flagged && (
            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
              Low
            </span>
          )}
        </div>
        <span className={`text-sm font-semibold ${textColor}`}>
          {milestone.completionPercentage.toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-brand-charcoal-700 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(milestone.completionPercentage, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {milestone.completedCount} / {milestone.totalNewUsers} users
        </span>
        <span>
          Avg. time: {formatHours(milestone.averageTimeToComplete)}
        </span>
      </div>
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Formats hours into a human-readable string.
 */
function formatHours(hours: number): string {
  if (hours === 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} hrs`;
  const days = hours / 24;
  return `${days.toFixed(1)} days`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function NewUsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

function CompletionIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
      />
    </svg>
  );
}
