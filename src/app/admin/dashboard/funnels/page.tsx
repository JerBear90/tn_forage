'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimeRange, TimeRangePreset, FunnelData, FunnelStep } from '@/types/admin-dashboard';
import ChartWidget from '@/components/admin/dashboard/ChartWidget';
import TimeRangeSelector from '@/components/admin/dashboard/TimeRangeSelector';
import { getFunnelData } from '@/services/admin/funnelService';
import { resolvePreset } from '@/services/admin/computations/timeRange';

export default function FunnelsPage() {
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('30d');
  const [timeRange, setTimeRange] = useState<TimeRange>(resolvePreset('30d'));
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunnels = useCallback(async (range: TimeRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFunnelData(range);
      setFunnels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funnel data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunnels(timeRange);
  }, [timeRange, fetchFunnels]);

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
            Funnel Tracking
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track user progression through key workflows and identify drop-off points
          </p>
        </div>
        <TimeRangeSelector selected={timeRangePreset} onChange={handleTimeRangeChange} />
      </div>

      {/* Funnel Visualizations */}
      {funnels.map((funnel) => (
        <ChartWidget
          key={funnel.name}
          title={funnel.name}
          subtitle="Conversion rates between each step"
          loading={loading}
          error={error ?? undefined}
        >
          {funnel.steps.length > 0 ? (
            <FunnelVisualization funnel={funnel} />
          ) : null}
        </ChartWidget>
      ))}

      {/* Show empty state when no funnels loaded and not loading */}
      {!loading && !error && funnels.length === 0 && (
        <ChartWidget title="No Funnel Data" loading={false}>
          {null}
        </ChartWidget>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel Visualization Component
// ---------------------------------------------------------------------------

interface FunnelVisualizationProps {
  funnel: FunnelData;
}

function FunnelVisualization({ funnel }: FunnelVisualizationProps) {
  const maxCount = Math.max(...funnel.steps.map((s) => s.userCount), 1);

  return (
    <div className="space-y-3" aria-label={`${funnel.name} funnel visualization`} role="img">
      {funnel.steps.map((step, index) => (
        <FunnelStepRow
          key={step.name}
          step={step}
          index={index}
          maxCount={maxCount}
          isLast={index === funnel.steps.length - 1}
          nextStep={funnel.steps[index + 1] ?? null}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel Step Row Component
// ---------------------------------------------------------------------------

interface FunnelStepRowProps {
  step: FunnelStep;
  index: number;
  maxCount: number;
  isLast: boolean;
  nextStep: FunnelStep | null;
}

function FunnelStepRow({ step, index, maxCount, isLast, nextStep }: FunnelStepRowProps) {
  const barWidth = maxCount > 0 ? (step.userCount / maxCount) * 100 : 0;
  const isHighlighted = step.highlighted;

  return (
    <div>
      {/* Step bar */}
      <div className="flex items-center gap-3">
        {/* Step number */}
        <div
          className={`
            flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
            ${isHighlighted
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-brand-teal-50 text-brand-teal dark:bg-brand-teal-900/30 dark:text-brand-teal'
            }
          `}
          aria-hidden="true"
        >
          {index + 1}
        </div>

        {/* Bar and label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-sm font-medium truncate ${
                isHighlighted
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-brand-charcoal dark:text-brand-sand'
              }`}
            >
              {step.name}
            </span>
            <span
              className={`text-sm font-semibold ml-2 shrink-0 ${
                isHighlighted
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-brand-charcoal dark:text-brand-sand'
              }`}
              aria-label={`${step.userCount} users`}
            >
              {step.userCount.toLocaleString()}
            </span>
          </div>

          {/* Horizontal bar */}
          <div
            className="h-6 rounded-md overflow-hidden bg-gray-100 dark:bg-brand-charcoal-700"
            role="progressbar"
            aria-valuenow={barWidth}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${step.name}: ${step.userCount} users, ${step.conversionRate}% conversion`}
          >
            <div
              className={`h-full rounded-md transition-all duration-500 ${
                isHighlighted
                  ? 'bg-red-500 dark:bg-red-600'
                  : 'bg-brand-teal dark:bg-brand-teal'
              }`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conversion rate arrow between steps */}
      {!isLast && nextStep && (
        <ConversionArrow
          rate={nextStep.conversionRate}
          highlighted={nextStep.highlighted}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversion Arrow Component
// ---------------------------------------------------------------------------

interface ConversionArrowProps {
  rate: number;
  highlighted: boolean;
}

function ConversionArrow({ rate, highlighted }: ConversionArrowProps) {
  return (
    <div className="flex items-center gap-3 py-1 pl-3">
      {/* Vertical connector line */}
      <div className="flex w-7 justify-center">
        <svg
          className={`h-5 w-4 ${
            highlighted ? 'text-red-400 dark:text-red-500' : 'text-gray-300 dark:text-gray-600'
          }`}
          viewBox="0 0 16 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 0v14m0 0l-4-4m4 4l4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Conversion rate badge */}
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          highlighted
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : rate >= 50
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}
        aria-label={`${rate}% conversion rate${highlighted ? ' - needs improvement' : ''}`}
      >
        {rate}% conversion
        {highlighted && (
          <svg
            className="ml-1 h-3 w-3"
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
        )}
      </span>
    </div>
  );
}


