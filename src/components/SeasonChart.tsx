'use client';

/**
 * ForageWise — SeasonChart Component
 *
 * Displays which months a species is available as a simple list.
 * Supports a compact mode for use inside heatmap rows.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.3
 */

import { getMonthsForSeasons, MONTH_LABELS, type MonthIndex } from '@/utils/seasonHelpers';

export interface SeasonChartProps {
  /** Season array from species/plant record, e.g. ["Spring", "Fall"] */
  seasons: string[];
  /** Compact mode for use inside heatmap rows */
  compact?: boolean;
}

export default function SeasonChart({ seasons, compact = false }: SeasonChartProps) {
  const inSeasonMonths = getMonthsForSeasons(seasons);
  const hasSeasonData = seasons.length > 0;
  const isAllYear = inSeasonMonths.size === 12;

  // When all 12 months are in-season, display a simple text label
  if (isAllYear) {
    return (
      <div className={compact ? '' : 'pb-6'}>
        <p
          role="status"
          className={`text-brand-moss dark:text-brand-moss-300 font-medium ${compact ? 'text-[10px]' : 'text-sm'}`}
        >
          Available all year round
        </p>
      </div>
    );
  }

  if (!hasSeasonData) {
    return (
      <div className={compact ? '' : 'pb-6'}>
        <p
          className={`text-gray-400 dark:text-gray-500 ${compact ? 'text-[10px]' : 'text-xs'}`}
          role="status"
        >
          No season data available
        </p>
      </div>
    );
  }

  const availableMonths = MONTH_LABELS.filter((_, i) => inSeasonMonths.has(i as MonthIndex));

  return (
    <div className={compact ? '' : 'pb-6'}>
      {/* Available months display */}
      <div
        role="status"
        aria-label="Months this species is available"
        className={compact ? '' : 'space-y-2'}
      >
        <p className={`text-brand-charcoal/70 dark:text-brand-sand/70 font-medium ${compact ? 'text-[10px]' : 'text-sm'}`}>
          Available:
        </p>
        <div className={`flex flex-wrap gap-2 ${compact ? 'mt-0.5' : 'mt-1'}`}>
          {availableMonths.map((month) => (
            <span
              key={month}
              className={`inline-block rounded-full bg-brand-moss/15 text-brand-moss dark:bg-brand-moss/25 dark:text-brand-moss-300 font-medium ${
                compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
              }`}
            >
              {month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
