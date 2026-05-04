'use client';

/**
 * ForageFlow — SeasonHeatmap Component
 *
 * Multi-species grid comparing seasonality across species.
 * Renders species names on the Y-axis and months on the X-axis.
 * Months start from the previous month and show 6 months forward,
 * with touch-scrollable horizontal navigation for all 12 months.
 * Current month column is highlighted. In-season cells use color + filled
 * dot (not color alone) for accessibility. Category filter tabs at the top:
 * All | Mushroom | Plant | Tree.
 * Uses ARIA table roles for screen reader navigation.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.2, 9.3
 */

import { useRef, useEffect } from 'react';
import { getMonthsForSeasons, MONTH_LABELS, getCurrentMonth, type MonthIndex } from '@/utils/seasonHelpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = 'mushroom' | 'plant' | 'tree';
type CategoryFilter = 'all' | Category;

export interface HeatmapItem {
  id: string;
  commonName: string;
  seasons: string[];
  category: Category;
}

export interface SeasonHeatmapProps {
  /** Array of species/plant records to display */
  items: HeatmapItem[];
  /** Currently selected category filter */
  categoryFilter: CategoryFilter;
  /** Callback when category filter changes */
  onCategoryFilterChange: (category: CategoryFilter) => void;
}

// ---------------------------------------------------------------------------
// Category filter tabs config
// ---------------------------------------------------------------------------

const CATEGORY_TABS: { label: string; value: CategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Mushroom', value: 'mushroom' },
  { label: 'Plant', value: 'plant' },
  { label: 'Tree', value: 'tree' },
];

// ---------------------------------------------------------------------------
// Pure filter function — exported for property-based testing
// ---------------------------------------------------------------------------

/**
 * Filter items by category. When filter is 'all', returns all items.
 * Otherwise returns only items whose category matches the filter.
 */
export function filterItemsByCategory(
  items: HeatmapItem[],
  filter: CategoryFilter,
): HeatmapItem[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.category === filter);
}

/**
 * Build an ordered array of month indices starting from one month before
 * the current month, wrapping around through all 12 months.
 */
function getOrderedMonths(currentMonth: MonthIndex): MonthIndex[] {
  const ordered: MonthIndex[] = [];
  // Start from 1 month before current
  const start = (currentMonth - 1 + 12) % 12;
  for (let i = 0; i < 12; i++) {
    ordered.push(((start + i) % 12) as MonthIndex);
  }
  return ordered;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SeasonHeatmap({
  items,
  categoryFilter,
  onCategoryFilterChange,
}: SeasonHeatmapProps) {
  const currentMonth = getCurrentMonth();
  const filteredItems = filterItemsByCategory(items, categoryFilter);
  const orderedMonths = getOrderedMonths(currentMonth);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show the current month column on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Current month is at index 1 in the ordered array (after the previous month).
    // Scroll so the current month is near the left edge.
    const columnWidth = 44; // min-w-[44px] per month cell
    const nameColumnWidth = 144; // w-36 = 144px
    // Scroll to show previous month at the left edge
    el.scrollLeft = 0;
  }, [currentMonth]);

  return (
    <div className="space-y-3">
      {/* Category filter tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Category filters"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = categoryFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onCategoryFilterChange(tab.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                isActive
                  ? 'bg-brand-teal text-white border-brand-teal'
                  : 'bg-white/60 dark:bg-dark-surface/60 text-brand-charcoal dark:text-dark-text border-brand-teal/20 hover:bg-brand-teal/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Horizontally scrollable heatmap grid — touch-friendly */}
      <div
        ref={scrollRef}
        className="overflow-x-auto -mx-1 px-1 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          role="table"
          aria-label="Species season heatmap"
          className="min-w-[640px]"
        >
          {/* Header row: empty corner cell + month labels */}
          <div role="row" className="flex">
            {/* Corner cell — species name column header */}
            <div
              role="columnheader"
              className="shrink-0 w-36 px-2 py-1.5 text-xs font-semibold text-brand-charcoal dark:text-dark-text"
            >
              Species
            </div>

            {/* Month column headers — ordered starting from previous month */}
            {orderedMonths.map((monthIndex) => {
              const isCurrent = monthIndex === currentMonth;
              return (
                <div
                  key={`header-${monthIndex}`}
                  role="columnheader"
                  className={`flex-1 min-w-[44px] px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide ${
                    isCurrent
                      ? 'text-brand-moss bg-brand-moss/10 ring-2 ring-brand-moss rounded-t'
                      : 'text-brand-charcoal/60 dark:text-dark-text-muted'
                  }`}
                >
                  {MONTH_LABELS[monthIndex]}
                </div>
              );
            })}
          </div>

          {/* Data rows */}
          {filteredItems.length === 0 ? (
            <div role="row" className="flex">
              <div
                role="cell"
                className="w-full py-6 text-center text-sm text-brand-charcoal/50 dark:text-dark-text-muted"
              >
                {categoryFilter === 'tree'
                  ? 'Trees are not seasonal — they are present year-round.'
                  : 'No species to display'}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const inSeasonMonths = getMonthsForSeasons(item.seasons);
              const isTree = item.category === 'tree';
              return (
                <div
                  key={item.id}
                  role="row"
                  className="flex border-t border-brand-charcoal/5 dark:border-dark-border"
                >
                  {/* Species name (row header) */}
                  <div
                    role="rowheader"
                    className="shrink-0 w-36 px-2 py-1.5 text-xs font-medium text-brand-charcoal dark:text-dark-text truncate"
                    title={item.commonName}
                  >
                    {item.commonName}
                  </div>

                  {/* Month cells — ordered */}
                  {orderedMonths.map((monthIndex) => {
                    const label = MONTH_LABELS[monthIndex];
                    const inSeason = isTree ? true : inSeasonMonths.has(monthIndex);
                    const isCurrent = monthIndex === currentMonth;
                    const statusText = isTree
                      ? 'Year-round'
                      : inSeason
                        ? 'In season'
                        : 'Not in season';
                    const ariaLabel = `${item.commonName}, ${label} — ${statusText}`;

                    // Category-specific icon for in-season cells
                    const categoryIcon = item.category === 'mushroom' ? '🍄'
                      : item.category === 'plant' ? '🌿'
                      : '🌳';

                    return (
                      <div
                        key={`${item.id}-${monthIndex}`}
                        role="cell"
                        aria-label={ariaLabel}
                        title={ariaLabel}
                        className={`flex-1 min-w-[44px] flex items-center justify-center py-1.5 text-center ${
                          isCurrent ? 'ring-2 ring-brand-moss' : ''
                        } ${
                          isTree
                            ? 'bg-brand-forest/10'
                            : inSeason
                              ? 'bg-brand-moss/20'
                              : 'bg-gray-100 dark:bg-dark-surface/40'
                        }`}
                      >
                        {(isTree || inSeason) && (
                          <span
                            className="text-[10px] leading-none"
                            aria-hidden="true"
                          >
                            {categoryIcon}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
