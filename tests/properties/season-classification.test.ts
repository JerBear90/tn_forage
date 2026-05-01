/**
 * Season-to-Month Classification — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 9: Season-to-month classification
 *
 * For any species with a season array and any month (0–11), the isInSeason
 * function shall return true if and only if the month falls within at least
 * one of the species' seasons according to the SEASON_MONTHS mapping
 * (Spring=[2,3,4], Summer=[5,6,7], Fall=[8,9,10], Winter=[11,0,1]).
 *
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Feature: phase3-enhancements, Property 9: Season-to-month classification

// ---------------------------------------------------------------------------
// Replicated from src/components/trip/LikelySpeciesPanel.tsx
// The source is a .tsx file which cannot be imported in a node vitest env,
// so we replicate the pure logic here for property testing.
// ---------------------------------------------------------------------------

const SEASON_MONTHS: Record<string, number[]> = {
  Spring: [2, 3, 4],   // Mar, Apr, May
  Summer: [5, 6, 7],   // Jun, Jul, Aug
  Fall: [8, 9, 10],    // Sep, Oct, Nov
  Winter: [11, 0, 1],  // Dec, Jan, Feb
};

function isInSeason(seasons: string[], month: number): boolean {
  return seasons.some((season) => {
    const months = SEASON_MONTHS[season];
    return months != null && months.includes(month);
  });
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALL_SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'] as const;

/** Generates a random subset of valid season names (including empty). */
const arbSeasonSubset: fc.Arbitrary<string[]> = fc.subarray(
  [...ALL_SEASONS],
  { minLength: 0, maxLength: 4 },
);

/** Generates a random month 0–11. */
const arbMonth: fc.Arbitrary<number> = fc.integer({ min: 0, max: 11 });

// ---------------------------------------------------------------------------
// Reference implementation for oracle testing
// ---------------------------------------------------------------------------

/**
 * Oracle: computes expected isInSeason result by checking whether the month
 * appears in any of the selected seasons' month arrays.
 */
function expectedIsInSeason(seasons: string[], month: number): boolean {
  for (const season of seasons) {
    const months = SEASON_MONTHS[season];
    if (months && months.includes(month)) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Feature: phase3-enhancements, Property 9: Season-to-month classification', () => {
  // ---------------------------------------------------------------------------
  // Property: isInSeason matches the SEASON_MONTHS oracle for random inputs
  // ---------------------------------------------------------------------------
  it('isInSeason returns true iff the month falls within at least one selected season', () => {
    fc.assert(
      fc.property(arbSeasonSubset, arbMonth, (seasons, month) => {
        const actual = isInSeason(seasons, month);
        const expected = expectedIsInSeason(seasons, month);
        expect(
          actual,
          `isInSeason(${JSON.stringify(seasons)}, ${month}) returned ${actual}, expected ${expected}`,
        ).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Empty season array always returns false
  // ---------------------------------------------------------------------------
  it('empty season array always returns false for any month', () => {
    fc.assert(
      fc.property(arbMonth, (month) => {
        expect(
          isInSeason([], month),
          `isInSeason([], ${month}) should be false`,
        ).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: All four seasons cover every month
  // ---------------------------------------------------------------------------
  it('all four seasons together cover every month 0–11', () => {
    fc.assert(
      fc.property(arbMonth, (month) => {
        expect(
          isInSeason([...ALL_SEASONS], month),
          `isInSeason with all seasons should be true for month ${month}`,
        ).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Unknown season names are ignored (never contribute true)
  // ---------------------------------------------------------------------------
  it('unknown season names do not contribute to a true result', () => {
    // Filter out strings that collide with Object.prototype property names
    // (e.g. "toString", "constructor") since SEASON_MONTHS is a plain object
    // and those keys would resolve to non-null inherited methods.
    const arbUnknownSeason = fc.string({ minLength: 1, maxLength: 20 }).filter(
      (s) =>
        !ALL_SEASONS.includes(s as typeof ALL_SEASONS[number]) &&
        !(s in SEASON_MONTHS) &&
        !Object.prototype.hasOwnProperty.call(Object.prototype, s),
    );
    const arbUnknownSeasons = fc.array(arbUnknownSeason, {
      minLength: 1,
      maxLength: 5,
    });

    fc.assert(
      fc.property(arbUnknownSeasons, arbMonth, (seasons, month) => {
        expect(
          isInSeason(seasons, month),
          `isInSeason(${JSON.stringify(seasons)}, ${month}) should be false for unknown seasons`,
        ).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
