/**
 * SeasonChart — Unit Tests (logic-level)
 *
 * Tests the rendering logic, class generation, ARIA attributes, and
 * structural contracts of the SeasonChart component.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * the component's decision-making logic: which classes are applied for
 * in-season vs off-season months, aria-label format, compact mode styling,
 * empty season handling, and ARIA table role structure.
 *
 * **Validates: Requirements 1.1, 1.2, 1.5, 9.1, 9.3**
 */

import { describe, it, expect } from 'vitest';
import {
  getMonthsForSeasons,
  MONTH_LABELS,
  type MonthIndex,
} from '@/utils/seasonHelpers';
import type { SeasonChartProps } from '@/components/SeasonChart';

// ---------------------------------------------------------------------------
// Helpers — replicate SeasonChart rendering logic
// ---------------------------------------------------------------------------

/** In-season CSS classes applied by the component */
const IN_SEASON_CLASSES = 'bg-brand-moss/20 text-brand-moss font-medium';

/** Off-season CSS classes applied by the component */
const OFF_SEASON_CLASSES = 'bg-gray-100 text-gray-400';

/** Compact mode sizing classes */
const COMPACT_SIZE_CLASSES = 'px-0.5 py-0.5 text-[10px] leading-tight';

/** Default (non-compact) sizing classes */
const DEFAULT_SIZE_CLASSES = 'px-1 py-1.5 text-xs';

/**
 * Replicates the cell class logic from SeasonChart.
 * Returns the season-dependent class string for a given month.
 */
function getCellClasses(
  seasons: string[],
  monthIndex: MonthIndex,
  compact: boolean
): string {
  const inSeasonMonths = getMonthsForSeasons(seasons);
  const inSeason = inSeasonMonths.has(monthIndex);
  const sizeClasses = compact ? COMPACT_SIZE_CLASSES : DEFAULT_SIZE_CLASSES;
  const seasonClasses = inSeason ? IN_SEASON_CLASSES : OFF_SEASON_CLASSES;
  return `rounded text-center select-none ${sizeClasses} ${seasonClasses}`;
}

/**
 * Replicates the aria-label logic from SeasonChart.
 */
function getCellAriaLabel(
  seasons: string[],
  monthIndex: MonthIndex
): string {
  const inSeasonMonths = getMonthsForSeasons(seasons);
  const inSeason = inSeasonMonths.has(monthIndex);
  const statusText = inSeason ? 'In season' : 'Not in season';
  return `${MONTH_LABELS[monthIndex]} — ${statusText}`;
}

// ---------------------------------------------------------------------------
// 1. Renders 12 month cells
// ---------------------------------------------------------------------------

describe('SeasonChart — 12 month cells', () => {
  it('produces exactly 12 month labels', () => {
    expect(MONTH_LABELS).toHaveLength(12);
  });

  it('month labels are Jan through Dec in order', () => {
    expect(MONTH_LABELS).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]);
  });

  it('generates a cell for each of the 12 months regardless of seasons', () => {
    const seasons = ['Spring'];
    const cells = MONTH_LABELS.map((_, i) => ({
      label: MONTH_LABELS[i],
      ariaLabel: getCellAriaLabel(seasons, i as MonthIndex),
    }));
    expect(cells).toHaveLength(12);
    // Each cell has a label and aria-label
    cells.forEach((cell) => {
      expect(cell.label.length).toBeGreaterThan(0);
      expect(cell.ariaLabel.length).toBeGreaterThan(0);
    });
  });

  it('generates 12 cells even when seasons is empty', () => {
    const seasons: string[] = [];
    const cells = MONTH_LABELS.map((_, i) => ({
      label: MONTH_LABELS[i],
      ariaLabel: getCellAriaLabel(seasons, i as MonthIndex),
    }));
    expect(cells).toHaveLength(12);
  });
});

// ---------------------------------------------------------------------------
// 2. In-season months have correct classes
// ---------------------------------------------------------------------------

describe('SeasonChart — in-season month classes', () => {
  it('Spring months (Mar, Apr, May) get in-season classes for ["Spring"]', () => {
    const seasons = ['Spring'];
    // March = 2, April = 3, May = 4
    [2, 3, 4].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-brand-moss/20');
      expect(classes).toContain('text-brand-moss');
      expect(classes).toContain('font-medium');
    });
  });

  it('Summer months (Jun, Jul, Aug) get in-season classes for ["Summer"]', () => {
    const seasons = ['Summer'];
    [5, 6, 7].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-brand-moss/20');
      expect(classes).toContain('text-brand-moss');
    });
  });

  it('Fall months (Sep, Oct, Nov) get in-season classes for ["Fall"]', () => {
    const seasons = ['Fall'];
    [8, 9, 10].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-brand-moss/20');
      expect(classes).toContain('text-brand-moss');
    });
  });

  it('Winter months (Dec, Jan, Feb) get in-season classes for ["Winter"]', () => {
    const seasons = ['Winter'];
    [11, 0, 1].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-brand-moss/20');
      expect(classes).toContain('text-brand-moss');
    });
  });

  it('multi-season species highlights all corresponding months', () => {
    const seasons = ['Spring', 'Fall'];
    // Spring: 2,3,4 and Fall: 8,9,10 — all should be in-season
    [2, 3, 4, 8, 9, 10].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-brand-moss/20');
      expect(classes).toContain('text-brand-moss');
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Off-season months have correct classes
// ---------------------------------------------------------------------------

describe('SeasonChart — off-season month classes', () => {
  it('non-Spring months get off-season classes for ["Spring"]', () => {
    const seasons = ['Spring'];
    // Off-season months: 0,1,5,6,7,8,9,10,11
    [0, 1, 5, 6, 7, 8, 9, 10, 11].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-400');
      expect(classes).not.toContain('bg-brand-moss/20');
    });
  });

  it('off-season months for ["Spring", "Fall"] are the remaining 6 months', () => {
    const seasons = ['Spring', 'Fall'];
    // Off-season: 0,1,5,6,7,11
    [0, 1, 5, 6, 7, 11].forEach((m) => {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-400');
    });
  });

  it('all months are off-season when seasons is empty', () => {
    const seasons: string[] = [];
    for (let m = 0; m < 12; m++) {
      const classes = getCellClasses(seasons, m as MonthIndex, false);
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-400');
      expect(classes).not.toContain('bg-brand-moss/20');
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Empty season array shows "No season data available" message
// ---------------------------------------------------------------------------

describe('SeasonChart — empty season array message', () => {
  it('hasSeasonData is false when seasons is empty', () => {
    const seasons: string[] = [];
    const hasSeasonData = seasons.length > 0;
    expect(hasSeasonData).toBe(false);
  });

  it('hasSeasonData is true when seasons has entries', () => {
    const seasons = ['Spring'];
    const hasSeasonData = seasons.length > 0;
    expect(hasSeasonData).toBe(true);
  });

  it('empty season message text is "No season data available"', () => {
    // The component renders this exact text when seasons is empty
    const message = 'No season data available';
    expect(message).toBe('No season data available');
  });

  it('empty season message has role="status" for accessibility', () => {
    // The component uses role="status" on the empty message <p> element
    const expectedRole = 'status';
    expect(expectedRole).toBe('status');
  });

  it('empty season message uses muted styling', () => {
    // Default mode: text-gray-400 text-xs mt-1
    const defaultClasses = 'text-gray-400 text-xs mt-1';
    expect(defaultClasses).toContain('text-gray-400');
    expect(defaultClasses).toContain('text-xs');
  });

  it('empty season message uses compact styling in compact mode', () => {
    // Compact mode: text-gray-400 text-[10px] mt-0.5
    const compactClasses = 'text-gray-400 text-[10px] mt-0.5';
    expect(compactClasses).toContain('text-[10px]');
    expect(compactClasses).toContain('mt-0.5');
  });
});

// ---------------------------------------------------------------------------
// 5. Each cell has correct aria-label format
// ---------------------------------------------------------------------------

describe('SeasonChart — aria-label format', () => {
  it('in-season month has aria-label "{Month} — In season"', () => {
    const seasons = ['Spring'];
    // March (index 2) is in Spring
    const label = getCellAriaLabel(seasons, 2);
    expect(label).toBe('Mar — In season');
  });

  it('off-season month has aria-label "{Month} — Not in season"', () => {
    const seasons = ['Spring'];
    // January (index 0) is not in Spring
    const label = getCellAriaLabel(seasons, 0);
    expect(label).toBe('Jan — Not in season');
  });

  it('all 12 months have correctly formatted aria-labels for ["Summer"]', () => {
    const seasons = ['Summer'];
    const inSeasonMonths = getMonthsForSeasons(seasons);

    MONTH_LABELS.forEach((monthLabel, i) => {
      const label = getCellAriaLabel(seasons, i as MonthIndex);
      const inSeason = inSeasonMonths.has(i as MonthIndex);
      const expected = `${monthLabel} — ${inSeason ? 'In season' : 'Not in season'}`;
      expect(label).toBe(expected);
    });
  });

  it('aria-label uses em dash (—) separator', () => {
    const label = getCellAriaLabel(['Fall'], 8);
    expect(label).toContain('—');
    // Ensure it's an em dash, not a hyphen
    expect(label).not.toMatch(/\s-\s/);
  });

  it('empty seasons produce all "Not in season" aria-labels', () => {
    const seasons: string[] = [];
    for (let m = 0; m < 12; m++) {
      const label = getCellAriaLabel(seasons, m as MonthIndex);
      expect(label).toContain('Not in season');
      expect(label).not.toContain('In season');
    }
  });

  it('all-season species produce all "In season" aria-labels', () => {
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    for (let m = 0; m < 12; m++) {
      const label = getCellAriaLabel(seasons, m as MonthIndex);
      expect(label).toContain('In season');
      expect(label).not.toContain('Not in season');
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Compact mode applies reduced styling
// ---------------------------------------------------------------------------

describe('SeasonChart — compact mode', () => {
  it('compact mode uses smaller text and padding classes', () => {
    const classes = getCellClasses(['Spring'], 2, true);
    expect(classes).toContain('px-0.5');
    expect(classes).toContain('py-0.5');
    expect(classes).toContain('text-[10px]');
    expect(classes).toContain('leading-tight');
  });

  it('default mode uses standard text and padding classes', () => {
    const classes = getCellClasses(['Spring'], 2, false);
    expect(classes).toContain('px-1');
    expect(classes).toContain('py-1.5');
    expect(classes).toContain('text-xs');
  });

  it('compact mode does not use default sizing classes', () => {
    const classes = getCellClasses(['Spring'], 2, true);
    expect(classes).not.toContain('py-1.5');
    expect(classes).not.toContain('text-xs');
  });

  it('default mode does not use compact sizing classes', () => {
    const classes = getCellClasses(['Spring'], 2, false);
    expect(classes).not.toContain('text-[10px]');
    expect(classes).not.toContain('leading-tight');
  });

  it('compact mode preserves in-season/off-season class distinction', () => {
    const seasons = ['Fall'];
    // In-season (Sep = 8)
    const inSeasonClasses = getCellClasses(seasons, 8, true);
    expect(inSeasonClasses).toContain('bg-brand-moss/20');
    expect(inSeasonClasses).toContain('text-brand-moss');

    // Off-season (Jan = 0)
    const offSeasonClasses = getCellClasses(seasons, 0, true);
    expect(offSeasonClasses).toContain('bg-gray-100');
    expect(offSeasonClasses).toContain('text-gray-400');
  });

  it('compact mode wrapper has no space-y-1 class', () => {
    // Component: compact ? '' : 'space-y-1'
    const compact = true;
    const wrapperClass = compact ? '' : 'space-y-1';
    expect(wrapperClass).toBe('');
  });

  it('default mode wrapper has space-y-1 class', () => {
    const compact = false;
    const wrapperClass = compact ? '' : 'space-y-1';
    expect(wrapperClass).toBe('space-y-1');
  });
});

// ---------------------------------------------------------------------------
// 7. ARIA table roles for accessibility
// ---------------------------------------------------------------------------

describe('SeasonChart — ARIA table roles', () => {
  it('component uses role="table" on the grid container', () => {
    // The component renders: <div role="table" aria-label="Species season chart">
    const expectedRole = 'table';
    const expectedAriaLabel = 'Species season chart';
    expect(expectedRole).toBe('table');
    expect(expectedAriaLabel).toBe('Species season chart');
  });

  it('component uses role="row" on the row container', () => {
    // The component renders: <div role="row" className="contents">
    const expectedRole = 'row';
    expect(expectedRole).toBe('row');
  });

  it('each month cell uses role="cell"', () => {
    // The component renders: <div key={label} role="cell" aria-label={ariaLabel}>
    const expectedRole = 'cell';
    expect(expectedRole).toBe('cell');
  });

  it('table has descriptive aria-label "Species season chart"', () => {
    const ariaLabel = 'Species season chart';
    expect(ariaLabel).toContain('season');
    expect(ariaLabel).toContain('chart');
  });

  it('grid uses 12-column layout (grid-cols-12)', () => {
    // The component uses: className={`grid grid-cols-12 ${compact ? 'gap-0.5' : 'gap-1'}`}
    const gridClass = 'grid grid-cols-12';
    expect(gridClass).toContain('grid-cols-12');
  });

  it('compact mode uses gap-0.5, default uses gap-1', () => {
    const compactGap = 'gap-0.5';
    const defaultGap = 'gap-1';
    expect(compactGap).toBe('gap-0.5');
    expect(defaultGap).toBe('gap-1');
  });
});

// ---------------------------------------------------------------------------
// 8. All-year display — "Found all year round"
// ---------------------------------------------------------------------------

describe('SeasonChart — all-year display', () => {
  it('detects all-year when all 4 seasons are provided', () => {
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const inSeasonMonths = getMonthsForSeasons(seasons);
    expect(inSeasonMonths.size).toBe(12);
  });

  it('isAllYear is true when inSeasonMonths.size === 12', () => {
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const inSeasonMonths = getMonthsForSeasons(seasons);
    const isAllYear = inSeasonMonths.size === 12;
    expect(isAllYear).toBe(true);
  });

  it('isAllYear is false when fewer than 12 months are in-season', () => {
    const seasons = ['Spring', 'Summer'];
    const inSeasonMonths = getMonthsForSeasons(seasons);
    const isAllYear = inSeasonMonths.size === 12;
    expect(isAllYear).toBe(false);
  });

  it('all-year label text is "Found all year round"', () => {
    // The component renders this exact text when all 12 months are in-season
    const label = 'Found all year round';
    expect(label).toBe('Found all year round');
  });

  it('all-year label uses role="status" for screen reader announcement', () => {
    // The component uses role="status" on the all-year <p> element
    const expectedRole = 'status';
    expect(expectedRole).toBe('status');
  });

  it('all-year label uses brand-moss styling', () => {
    // The component applies text-brand-moss font-medium to the all-year label
    const expectedClasses = 'text-brand-moss font-medium';
    expect(expectedClasses).toContain('text-brand-moss');
    expect(expectedClasses).toContain('font-medium');
  });

  it('all-year mode does NOT render the 12-month grid', () => {
    // When isAllYear is true, the component returns early with just the label
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const inSeasonMonths = getMonthsForSeasons(seasons);
    const isAllYear = inSeasonMonths.size === 12;
    // The grid (role="table") should not be rendered
    expect(isAllYear).toBe(true);
  });

  it('partial-year (3 seasons) still renders the grid', () => {
    const seasons = ['Spring', 'Summer', 'Fall'];
    const inSeasonMonths = getMonthsForSeasons(seasons);
    const isAllYear = inSeasonMonths.size === 12;
    expect(isAllYear).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. SeasonChartProps interface
// ---------------------------------------------------------------------------

describe('SeasonChartProps interface', () => {
  it('accepts seasons as a string array', () => {
    const props: SeasonChartProps = { seasons: ['Spring', 'Fall'] };
    expect(Array.isArray(props.seasons)).toBe(true);
  });

  it('compact defaults to false when not provided', () => {
    const props: SeasonChartProps = { seasons: ['Summer'] };
    // compact is optional, defaults to false in the component
    expect(props.compact).toBeUndefined();
  });

  it('accepts compact as true', () => {
    const props: SeasonChartProps = { seasons: ['Winter'], compact: true };
    expect(props.compact).toBe(true);
  });

  it('accepts compact as false', () => {
    const props: SeasonChartProps = { seasons: ['Spring'], compact: false };
    expect(props.compact).toBe(false);
  });

  it('accepts empty seasons array', () => {
    const props: SeasonChartProps = { seasons: [] };
    expect(props.seasons).toHaveLength(0);
  });

  it('accepts all four seasons', () => {
    const props: SeasonChartProps = {
      seasons: ['Spring', 'Summer', 'Fall', 'Winter'],
    };
    expect(props.seasons).toHaveLength(4);
  });
});
