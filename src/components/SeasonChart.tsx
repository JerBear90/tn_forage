'use client';

/**
 * ForageWise — SeasonChart Component
 *
 * Displays a 12-month grid for a single species showing which months
 * it is in season. Uses semantic table roles for screen reader support.
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
      <div className={compact ? '' : 'space-y-1'}>
        <p
          role="status"
          className={`text-brand-moss font-medium ${compact ? 'text-[10px]' : 'text-sm'}`}
        >
          Found all year round
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'space-y-1'}>
      <div
        role="table"
        aria-label="Species season chart"
        className={`grid grid-cols-12 ${compact ? 'gap-0.5' : 'gap-1'}`}
      >
        <div role="row" className="contents">
          {MONTH_LABELS.map((label, index) => {
            const monthIndex = index as MonthIndex;
            const inSeason = inSeasonMonths.has(monthIndex);
            const statusText = inSeason ? 'In season' : 'Not in season';
            const ariaLabel = `${label} — ${statusText}`;

            return (
              <div
                key={label}
                role="cell"
                aria-label={ariaLabel}
                title={ariaLabel}
                className={`
                  rounded text-center select-none
                  ${compact ? 'px-0.5 py-0.5 text-[10px] leading-tight' : 'px-1 py-1.5 text-xs'}
                  ${inSeason
                    ? 'bg-brand-moss/20 text-brand-moss font-medium'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available months text summary */}
      {hasSeasonData && (
        <p
          className={`text-brand-moss font-medium ${compact ? 'text-[10px] mt-0.5' : 'text-xs mt-2'}`}
          role="status"
        >
          Available: {MONTH_LABELS.filter((_, i) => inSeasonMonths.has(i as MonthIndex)).join(', ')}
        </p>
      )}

      {!hasSeasonData && (
        <p
          className={`text-gray-400 ${compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'}`}
          role="status"
        >
          No season data available
        </p>
      )}
    </div>
  );
}
