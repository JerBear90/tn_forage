'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { pb } from '@/auth/authService';

// ---------------------------------------------------------------------------
// Feature category mapping
// ---------------------------------------------------------------------------

const FEATURE_CATEGORIES: Record<string, string> = {
  'field-guide': 'Field Guide',
  'map': 'Map',
  'trips': 'Trips',
  'community': 'Community',
  'identification': 'Identification',
  'journal': 'Journal',
};

const FEATURE_KEYS = Object.keys(FEATURE_CATEGORIES);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureUsageChartProps {
  timeRange: TimeRange;
}

interface FeatureUsageData {
  featureKey: string;
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchFeatureUsage(timeRange: TimeRange): Promise<FeatureUsageData[]> {
  const startISO = timeRange.startDate.toISOString();
  const endISO = timeRange.endDate.toISOString();

  // Fetch all usage events within the time range
  const records = await pb.collection('analytics_usage_events').getFullList({
    filter: `timestamp >= "${startISO}" && timestamp <= "${endISO}"`,
    fields: 'featureKey',
  });

  // Count events by featureKey
  const counts: Record<string, number> = {};
  for (const key of FEATURE_KEYS) {
    counts[key] = 0;
  }
  for (const record of records) {
    const key = record.featureKey as string;
    if (key in counts) {
      counts[key]++;
    }
  }

  // Build sorted result (descending by count)
  const result: FeatureUsageData[] = FEATURE_KEYS.map((key) => ({
    featureKey: key,
    label: FEATURE_CATEGORIES[key],
    count: counts[key],
  }));

  result.sort((a, b) => b.count - a.count);

  return result;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RankedList({ data }: { data: FeatureUsageData[] }) {
  if (data.length === 0) return null;

  const maxCount = data[0]?.count ?? 1;

  return (
    <ol className="space-y-2 mt-4" aria-label="Feature usage ranked list">
      {data.map((item, index) => (
        <li
          key={item.featureKey}
          className="flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {/* Rank badge */}
          <span
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal text-xs font-bold"
            aria-hidden="true"
          >
            {index + 1}
          </span>

          {/* Feature name and bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
                {item.label}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 tabular-nums">
                {item.count.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"
              role="progressbar"
              aria-valuenow={item.count}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-label={`${item.label}: ${item.count} uses`}
            >
              <div
                className="h-full rounded-full bg-brand-teal transition-all duration-300"
                style={{ width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function FeatureUsageChart({ timeRange }: FeatureUsageChartProps) {
  const [data, setData] = useState<FeatureUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await fetchFeatureUsage(timeRange);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature usage data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = data.map((item) => ({
    name: item.label,
    count: item.count,
  }));

  const totalUsage = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartWidget
      title="Feature Usage"
      subtitle={totalUsage > 0 ? `${totalUsage.toLocaleString()} total events` : undefined}
      loading={loading}
      error={error}
    >
      {data.length > 0 && (
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="h-56" aria-label="Feature usage comparison bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_COLORS.grid}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                  allowDecimals={false}
                  aria-label="Usage count axis"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                  width={100}
                  aria-label="Feature name axis"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg, #fff)',
                    borderColor: CHART_COLORS.grid,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value) => [Number(value).toLocaleString(), 'Events']}
                />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS.primary}
                  radius={[0, 4, 4, 0]}
                  name="Usage events"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked List */}
          <RankedList data={data} />
        </div>
      )}
    </ChartWidget>
  );
}
