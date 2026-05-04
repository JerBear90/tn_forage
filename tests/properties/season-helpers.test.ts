/**
 * Season Helpers — Property-Based Tests
 *
 * Feature: season-charts-voice-map, Property 1: Season-to-month mapping correctness
 *
 * For any subset of valid season names (Spring, Summer, Fall, Winter),
 * `getMonthsForSeasons(seasons)` SHALL return a set of month indices that
 * is exactly the union of the month indices defined in `SEASON_MONTHS` for
 * each season in the input. Conversely, for any month index in the result,
 * there SHALL exist at least one season in the input whose `SEASON_MONTHS`
 * entry contains that month.
 *
 * **Validates: Requirements 1.2, 2.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getMonthsForSeasons,
  SEASON_MONTHS,
  type SeasonName,
  type MonthIndex,
} from '@/utils/seasonHelpers';

// Feature: season-charts-voice-map, Property 1: Season-to-month mapping correctness

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALL_SEASONS: SeasonName[] = ['Spring', 'Summer', 'Fall', 'Winter'];

/** Arbitrary subset of valid season names (0 to 4 seasons) */
const arbSeasonSubset: fc.Arbitrary<SeasonName[]> = fc.subarray(ALL_SEASONS, {
  minLength: 0,
  maxLength: 4,
});

/** Arbitrary array that may include invalid season strings mixed with valid ones */
const arbSeasonsWithInvalid: fc.Arbitrary<string[]> = fc.array(
  fc.oneof(
    fc.constantFrom(...ALL_SEASONS),
    fc.string({ minLength: 1, maxLength: 10 }).filter(
      (s) => !ALL_SEASONS.includes(s as SeasonName),
    ),
  ),
  { minLength: 0, maxLength: 8 },
);

// ---------------------------------------------------------------------------
// Helper: compute expected union of months for a set of seasons
// ---------------------------------------------------------------------------

function expectedMonthUnion(seasons: string[]): Set<MonthIndex> {
  const result = new Set<MonthIndex>();
  for (const season of seasons) {
    if (ALL_SEASONS.includes(season as SeasonName)) {
      for (const month of SEASON_MONTHS[season as SeasonName]) {
        result.add(month);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: season-charts-voice-map, Property 1: Season-to-month mapping correctness', () => {
  it('returns exactly the union of SEASON_MONTHS entries for any subset of valid seasons', () => {
    fc.assert(
      fc.property(arbSeasonSubset, (seasons) => {
        const result = getMonthsForSeasons(seasons);
        const expected = expectedMonthUnion(seasons);

        // Result should equal the expected union exactly
        expect(result.size).toBe(expected.size);
        for (const month of Array.from(expected)) {
          expect(result.has(month)).toBe(true);
        }
        for (const month of Array.from(result)) {
          expect(expected.has(month)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('every month in the result has a corresponding season in the input', () => {
    fc.assert(
      fc.property(arbSeasonSubset, (seasons) => {
        const result = getMonthsForSeasons(seasons);

        for (const month of Array.from(result)) {
          // There must be at least one season in the input whose
          // SEASON_MONTHS entry contains this month
          const hasCoveringSeason = seasons.some((s) =>
            SEASON_MONTHS[s as SeasonName]?.includes(month),
          );
          expect(hasCoveringSeason).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('ignores invalid season strings and returns only months for valid seasons', () => {
    fc.assert(
      fc.property(arbSeasonsWithInvalid, (seasons) => {
        const result = getMonthsForSeasons(seasons);
        const expected = expectedMonthUnion(seasons);

        // Should match the expected union (invalid strings contribute nothing)
        expect(result.size).toBe(expected.size);
        for (const month of Array.from(expected)) {
          expect(result.has(month)).toBe(true);
        }
        for (const month of Array.from(result)) {
          expect(expected.has(month)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('returns an empty set when given an empty array', () => {
    const result = getMonthsForSeasons([]);
    expect(result.size).toBe(0);
  });

  it('returns all 12 months when all four seasons are provided', () => {
    const result = getMonthsForSeasons(['Spring', 'Summer', 'Fall', 'Winter']);
    expect(result.size).toBe(12);
    for (let i = 0; i < 12; i++) {
      expect(result.has(i as MonthIndex)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 6: Species-to-month grouping completeness
// ---------------------------------------------------------------------------

/**
 * Feature: season-charts-voice-map, Property 6: Species-to-month grouping completeness
 *
 * For any set of mushroom species with varying `season` arrays, grouping
 * species by month using the Season_Month_Mapping SHALL result in each
 * species appearing in exactly the months that its season array maps to.
 * A species with an empty season array SHALL appear in no months.
 *
 * **Validates: Requirements 7.2**
 */

// ---------------------------------------------------------------------------
// Types & helpers for Property 6
// ---------------------------------------------------------------------------

interface TestSpecies {
  id: string;
  commonName: string;
  seasons: string[];
}

/**
 * Simulate the grouping logic that useMushroomCalendar performs:
 * for each month 0–11, collect the species whose seasons map to that month.
 */
function groupSpeciesByMonth(
  species: TestSpecies[],
): Map<MonthIndex, TestSpecies[]> {
  const grouped = new Map<MonthIndex, TestSpecies[]>();
  for (let m = 0; m < 12; m++) {
    grouped.set(m as MonthIndex, []);
  }
  for (const sp of species) {
    const months = getMonthsForSeasons(sp.seasons);
    for (const month of Array.from(months)) {
      grouped.get(month)!.push(sp);
    }
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Arbitraries for Property 6
// ---------------------------------------------------------------------------

/** Arbitrary species with a random subset of valid seasons */
const arbSpecies: fc.Arbitrary<TestSpecies> = fc
  .record({
    id: fc.uuid(),
    commonName: fc.string({ minLength: 1, maxLength: 30 }),
    seasons: fc.subarray(['Spring', 'Summer', 'Fall', 'Winter'] as string[], {
      minLength: 0,
      maxLength: 4,
    }),
  });

/** Arbitrary non-empty list of species */
const arbSpeciesList: fc.Arbitrary<TestSpecies[]> = fc.array(arbSpecies, {
  minLength: 1,
  maxLength: 20,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: season-charts-voice-map, Property 6: Species-to-month grouping completeness', () => {
  it('each species appears in exactly the months its seasons map to', () => {
    fc.assert(
      fc.property(arbSpeciesList, (speciesList) => {
        const grouped = groupSpeciesByMonth(speciesList);

        for (const sp of speciesList) {
          const expectedMonths = getMonthsForSeasons(sp.seasons);

          for (let m = 0; m < 12; m++) {
            const month = m as MonthIndex;
            const speciesInMonth = grouped.get(month)!;
            const isPresent = speciesInMonth.some((s) => s.id === sp.id);

            if (expectedMonths.has(month)) {
              // Species should appear in this month
              expect(isPresent).toBe(true);
            } else {
              // Species should NOT appear in this month
              expect(isPresent).toBe(false);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('species with empty season arrays appear in no months', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            commonName: fc.string({ minLength: 1, maxLength: 30 }),
            seasons: fc.constant([] as string[]),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (speciesList) => {
          const grouped = groupSpeciesByMonth(speciesList);

          // Every month should have zero species
          for (let m = 0; m < 12; m++) {
            expect(grouped.get(m as MonthIndex)!.length).toBe(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no species appears in a month that its seasons do not map to', () => {
    fc.assert(
      fc.property(arbSpeciesList, (speciesList) => {
        const grouped = groupSpeciesByMonth(speciesList);

        for (let m = 0; m < 12; m++) {
          const month = m as MonthIndex;
          const speciesInMonth = grouped.get(month)!;

          for (const sp of speciesInMonth) {
            // Every species in this month must have this month in its mapped months
            const mappedMonths = getMonthsForSeasons(sp.seasons);
            expect(mappedMonths.has(month)).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
