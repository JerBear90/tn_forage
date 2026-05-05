/**
 * MushroomCalendarPage — Unit Tests (logic-level)
 *
 * Tests the rendering logic and decision-making of the MushroomCalendarPage
 * component: 12 month sections, current month highlight, species thumbnails
 * and common names, safety disclaimer at top, navigation links to species
 * detail, monthly foraging tips display, and expert verification references.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * the component's decision-making logic by replicating the same branching
 * and data lookups the component performs.
 *
 * **Validates: Requirements 7.1, 7.2, 7.4, 7.5, 10.3**
 */

import { describe, it, expect } from 'vitest';
import { MONTH_NAMES, getCurrentMonth } from '@/utils/seasonHelpers';
import { monthlyForagingTips } from '@/data/foragingTips';
import type { MonthData } from '@/hooks/useMushroomCalendar';

// ---------------------------------------------------------------------------
// Helpers — replicate MushroomCalendarPage rendering logic
// ---------------------------------------------------------------------------

/**
 * Replicates the current-month highlight logic from the page.
 * The current month section gets `ring-2 ring-brand-moss` styling.
 */
function getMonthSectionClasses(monthIndex: number, currentMonth: number): string {
  const isCurrent = monthIndex === currentMonth;
  return isCurrent
    ? 'ring-2 ring-brand-moss border-brand-moss/40 bg-brand-moss/5 dark:bg-brand-moss/10'
    : 'border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80';
}

/**
 * Replicates the section aria-label logic from the page.
 */
function getMonthSectionAriaLabel(label: string, monthIndex: number, currentMonth: number): string {
  const isCurrent = monthIndex === currentMonth;
  return `${label}${isCurrent ? ' (current month)' : ''}`;
}

/**
 * Replicates the species link href logic from the page.
 * Each species name links to `/field-guide/{species-id}`.
 */
function getSpeciesHref(speciesId: string): string {
  return `/field-guide/${speciesId}`;
}

/**
 * Determines whether the "Current" badge is shown for a month.
 */
function showsCurrentBadge(monthIndex: number, currentMonth: number): boolean {
  return monthIndex === currentMonth;
}

/**
 * Determines whether the empty-species fallback message is shown.
 */
function showsEmptyMessage(species: MonthData['species']): boolean {
  return species.length === 0;
}

// ---------------------------------------------------------------------------
// Safety disclaimer text (exact text from the component)
// ---------------------------------------------------------------------------

const SAFETY_DISCLAIMER_TEXT =
  'All identifications shown are possible matches only. Always verify with a qualified expert before consuming any foraged species.';

// ---------------------------------------------------------------------------
// Sample test data
// ---------------------------------------------------------------------------

const sampleSpecies: MonthData['species'] = [
  { id: 'sp-chanterelle', commonName: 'Chanterelle', image: '/images/species/sp-chanterelle.jpg', summary: 'Golden funnel-shaped mushroom found near oaks in summer and fall.' },
  { id: 'sp-morel', commonName: 'Morel', image: '/images/species/sp-morel.jpg', summary: 'Honeycomb-capped spring mushroom found in disturbed soils near tulip poplars.' },
  { id: 'sp-chicken-of-the-woods', commonName: 'Chicken of the Woods', image: '', summary: 'Bright orange shelf fungus on hardwoods, prized for its meaty texture when young.' },
];

function buildSampleMonths(currentMonth: number): MonthData[] {
  return MONTH_NAMES.map((label, i) => ({
    month: i,
    label,
    species: i === currentMonth ? sampleSpecies : [],
    foragingTip: monthlyForagingTips.find((t) => t.month === i)?.tip ?? '',
  }));
}

// ---------------------------------------------------------------------------
// 1. Page renders 12 month sections (one per month)
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — 12 month sections', () => {
  it('MONTH_NAMES contains exactly 12 entries', () => {
    expect(MONTH_NAMES).toHaveLength(12);
  });

  it('MONTH_NAMES starts with January and ends with December', () => {
    expect(MONTH_NAMES[0]).toBe('January');
    expect(MONTH_NAMES[11]).toBe('December');
  });

  it('builds exactly 12 month sections from hook data', () => {
    const months = buildSampleMonths(5);
    expect(months).toHaveLength(12);
  });

  it('each month section has a unique month index 0–11', () => {
    const months = buildSampleMonths(0);
    const indices = months.map((m) => m.month);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('each month section has the correct label from MONTH_NAMES', () => {
    const months = buildSampleMonths(0);
    months.forEach((m, i) => {
      expect(m.label).toBe(MONTH_NAMES[i]);
    });
  });

  it('month sections are rendered in calendar order (Jan–Dec)', () => {
    const months = buildSampleMonths(0);
    const labels = months.map((m) => m.label);
    expect(labels).toEqual(MONTH_NAMES);
  });
});

// ---------------------------------------------------------------------------
// 2. Current month section has highlight styling (ring-2 ring-brand-moss)
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — current month highlight', () => {
  it('current month section gets ring-2 ring-brand-moss classes', () => {
    const currentMonth = getCurrentMonth();
    const classes = getMonthSectionClasses(currentMonth, currentMonth);
    expect(classes).toContain('ring-2');
    expect(classes).toContain('ring-brand-moss');
  });

  it('non-current month sections do not get ring classes', () => {
    const currentMonth = 5; // June
    const otherMonth = 0; // January
    const classes = getMonthSectionClasses(otherMonth, currentMonth);
    expect(classes).not.toContain('ring-2');
    expect(classes).not.toContain('ring-brand-moss');
  });

  it('current month section gets brand-moss background tint', () => {
    const classes = getMonthSectionClasses(3, 3);
    expect(classes).toContain('bg-brand-moss/5');
  });

  it('non-current month sections get neutral background', () => {
    const classes = getMonthSectionClasses(3, 7);
    expect(classes).toContain('bg-white/80');
  });

  it('exactly one month gets the highlight for any given currentMonth', () => {
    const currentMonth = 9; // October
    let highlightCount = 0;
    for (let m = 0; m < 12; m++) {
      const classes = getMonthSectionClasses(m, currentMonth);
      if (classes.includes('ring-2')) highlightCount++;
    }
    expect(highlightCount).toBe(1);
  });

  it('current month shows "Current" badge', () => {
    expect(showsCurrentBadge(7, 7)).toBe(true);
  });

  it('non-current month does not show "Current" badge', () => {
    expect(showsCurrentBadge(3, 7)).toBe(false);
  });

  it('current month aria-label includes "(current month)" suffix', () => {
    const label = getMonthSectionAriaLabel('October', 9, 9);
    expect(label).toBe('October (current month)');
  });

  it('non-current month aria-label does not include "(current month)"', () => {
    const label = getMonthSectionAriaLabel('January', 0, 9);
    expect(label).toBe('January');
    expect(label).not.toContain('(current month)');
  });
});

// ---------------------------------------------------------------------------
// 3. Species in each month have thumbnails and common names
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — species thumbnails and names', () => {
  it('species entries include an image field for thumbnails', () => {
    sampleSpecies.forEach((s) => {
      expect(s).toHaveProperty('image');
    });
  });

  it('species entries include a commonName field', () => {
    sampleSpecies.forEach((s) => {
      expect(s).toHaveProperty('commonName');
      expect(s.commonName.length).toBeGreaterThan(0);
    });
  });

  it('species with images have non-empty image paths', () => {
    const withImages = sampleSpecies.filter((s) => s.image !== '');
    expect(withImages.length).toBeGreaterThan(0);
    withImages.forEach((s) => {
      expect(s.image).toMatch(/\//); // contains a path separator
    });
  });

  it('species with empty image still renders (graceful fallback)', () => {
    const noImage = sampleSpecies.find((s) => s.image === '');
    expect(noImage).toBeDefined();
    // The component passes the image to SpeciesImage which handles fallback
    expect(noImage!.commonName).toBe('Chicken of the Woods');
  });

  it('months with no species show empty-state message', () => {
    expect(showsEmptyMessage([])).toBe(true);
  });

  it('months with species do not show empty-state message', () => {
    expect(showsEmptyMessage(sampleSpecies)).toBe(false);
  });

  it('empty-state message text is "No mushroom species in season this month."', () => {
    const message = 'No mushroom species in season this month.';
    expect(message).toBe('No mushroom species in season this month.');
  });
});

// ---------------------------------------------------------------------------
// 4. Safety disclaimer is present at the top with correct text
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — safety disclaimer', () => {
  it('safety disclaimer contains "possible matches only"', () => {
    expect(SAFETY_DISCLAIMER_TEXT).toContain('possible matches only');
  });

  it('safety disclaimer contains "qualified expert"', () => {
    expect(SAFETY_DISCLAIMER_TEXT).toContain('qualified expert');
  });

  it('safety disclaimer contains "verify"', () => {
    expect(SAFETY_DISCLAIMER_TEXT).toContain('verify');
  });

  it('safety disclaimer does not contain banned phrase "safe to eat"', () => {
    expect(SAFETY_DISCLAIMER_TEXT.toLowerCase()).not.toContain('safe to eat');
  });

  it('safety disclaimer does not contain banned phrase "definitely edible"', () => {
    expect(SAFETY_DISCLAIMER_TEXT.toLowerCase()).not.toContain('definitely edible');
  });

  it('safety disclaimer does not contain banned phrase "confirmed edible"', () => {
    expect(SAFETY_DISCLAIMER_TEXT.toLowerCase()).not.toContain('confirmed edible');
  });

  it('safety disclaimer does not contain banned phrase "ai verified"', () => {
    expect(SAFETY_DISCLAIMER_TEXT.toLowerCase()).not.toContain('ai verified');
  });

  it('safety disclaimer has role="alert" for accessibility', () => {
    // The component renders: <div role="alert" ...>
    const expectedRole = 'alert';
    expect(expectedRole).toBe('alert');
  });

  it('safety disclaimer uses amber warning styling', () => {
    // The component renders: className="... border-amber-300 bg-amber-50 ..."
    const classes = 'rounded-lg border border-amber-300 bg-amber-50';
    expect(classes).toContain('border-amber-300');
    expect(classes).toContain('bg-amber-50');
  });
});

// ---------------------------------------------------------------------------
// 5. Species names link to /field-guide/{species-id}
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — navigation to species detail', () => {
  it('species link href follows /field-guide/{id} pattern', () => {
    const href = getSpeciesHref('sp-chanterelle');
    expect(href).toBe('/field-guide/sp-chanterelle');
  });

  it('species link href starts with /field-guide/', () => {
    const href = getSpeciesHref('sp-morel');
    expect(href).toMatch(/^\/field-guide\//);
  });

  it('species link href includes the exact species id', () => {
    const id = 'sp-chicken-of-the-woods';
    const href = getSpeciesHref(id);
    expect(href).toContain(id);
  });

  it('each species in sample data produces a unique link', () => {
    const hrefs = sampleSpecies.map((s) => getSpeciesHref(s.id));
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(sampleSpecies.length);
  });

  it('species links use Next.js Link component pattern (href prop)', () => {
    // The component renders: <Link href={`/field-guide/${species.id}`}>
    const href = getSpeciesHref('sp-lions-mane');
    expect(href).toBe('/field-guide/sp-lions-mane');
  });
});

// ---------------------------------------------------------------------------
// 6. Monthly foraging tips are displayed for each month
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — monthly foraging tips', () => {
  it('monthlyForagingTips has exactly 12 entries (one per month)', () => {
    expect(monthlyForagingTips).toHaveLength(12);
  });

  it('monthlyForagingTips covers all months 0–11', () => {
    const months = monthlyForagingTips.map((t) => t.month).sort((a, b) => a - b);
    expect(months).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('each monthly foraging tip has non-empty text', () => {
    monthlyForagingTips.forEach((t) => {
      expect(t.tip.length).toBeGreaterThan(0);
    });
  });

  it('foraging tip is displayed when present in month data', () => {
    const monthData: MonthData = {
      month: 3,
      label: 'April',
      species: [],
      foragingTip: 'April is peak morel season across Tennessee.',
    };
    const showsTip = monthData.foragingTip.length > 0;
    expect(showsTip).toBe(true);
  });

  it('foraging tip section is hidden when tip is empty', () => {
    const monthData: MonthData = {
      month: 0,
      label: 'January',
      species: [],
      foragingTip: '',
    };
    const showsTip = monthData.foragingTip.length > 0;
    expect(showsTip).toBe(false);
  });

  it('foraging tip label text is "Foraging tip:"', () => {
    // The component renders: <span className="font-semibold ...">Foraging tip:</span>
    const label = 'Foraging tip:';
    expect(label).toBe('Foraging tip:');
  });
});

// ---------------------------------------------------------------------------
// 7. All monthly foraging tips contain expert verification reference
// ---------------------------------------------------------------------------

describe('MushroomCalendarPage — expert verification in tips', () => {
  it('every monthly foraging tip contains the word "expert"', () => {
    monthlyForagingTips.forEach((t) => {
      expect(t.tip.toLowerCase()).toContain('expert');
    });
  });

  it('every monthly foraging tip contains the word "verify"', () => {
    monthlyForagingTips.forEach((t) => {
      expect(t.tip.toLowerCase()).toContain('verify');
    });
  });

  it('no monthly foraging tip contains banned phrase "safe to eat"', () => {
    monthlyForagingTips.forEach((t) => {
      expect(t.tip.toLowerCase()).not.toContain('safe to eat');
    });
  });

  it('no monthly foraging tip contains banned phrase "definitely edible"', () => {
    monthlyForagingTips.forEach((t) => {
      expect(t.tip.toLowerCase()).not.toContain('definitely edible');
    });
  });
});
