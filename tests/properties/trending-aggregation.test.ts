/**
 * Trending Species Aggregation — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 8: Trending species aggregation
 *
 * For any set of community sightings with various createdAt dates and
 * speciesGuess values, the aggregateTrendingSpecies function shall count
 * only sightings from the current calendar month, group them by
 * case-insensitive speciesGuess, and return results sorted by count
 * descending. The returned array shall contain at most the top N species
 * (where N is configurable, default 3).
 *
 * **Validates: Requirements 8.2, 8.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { CommunityDraft } from '@/types';
import {
  aggregateTrendingSpecies,
  type KnownSpeciesRecord,
} from '@/services/trending';

// Feature: phase3-enhancements, Property 8: Trending species aggregation

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

/**
 * Generate a date within the current calendar month.
 */
const arbCurrentMonthDate: fc.Arbitrary<string> = fc
  .integer({ min: 1, max: 28 })
  .chain((day) =>
    fc
      .integer({ min: 0, max: 23 })
      .map(
        (hour) =>
          new Date(currentYear, currentMonth, day, hour).toISOString(),
      ),
  );

/**
 * Generate a date that is NOT in the current calendar month.
 * We pick a month offset of 1–11 months in the past.
 */
const arbOtherMonthDate: fc.Arbitrary<string> = fc
  .integer({ min: 1, max: 11 })
  .chain((monthsAgo) => {
    const d = new Date(currentYear, currentMonth - monthsAgo, 15);
    return fc.constant(d.toISOString());
  });

/**
 * Arbitrary for a species guess string (non-empty).
 * We pick from a small set of realistic species names with case variations
 * to ensure meaningful grouping collisions.
 */
const SPECIES_NAMES = [
  'Chanterelle',
  'chanterelle',
  'CHANTERELLE',
  'Morel',
  'morel',
  'MOREL',
  'Turkey Tail',
  'turkey tail',
  'Lions Mane',
  'lions mane',
  'Reishi',
  'reishi',
  'Chicken of the Woods',
  'chicken of the woods',
  'Hen of the Woods',
  'hen of the woods',
  'Pawpaw',
  'pawpaw',
  'Ramps',
  'ramps',
];

const arbSpeciesGuess = fc.constantFrom(...SPECIES_NAMES);

/**
 * Build a CommunityDraft with the given date and speciesGuess.
 */
function makeDraft(
  createdAt: string,
  speciesGuess: string | undefined,
): CommunityDraft {
  return {
    id: crypto.randomUUID(),
    userId: 'user-1',
    speciesGuess,
    photos: [],
    notes: '',
    visibility: 'public',
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Arbitrary for a sighting that falls in the current month with a species guess.
 */
const arbCurrentMonthSighting: fc.Arbitrary<CommunityDraft> = fc
  .tuple(arbCurrentMonthDate, arbSpeciesGuess)
  .map(([date, guess]) => makeDraft(date, guess));

/**
 * Arbitrary for a sighting that falls outside the current month.
 */
const arbOtherMonthSighting: fc.Arbitrary<CommunityDraft> = fc
  .tuple(arbOtherMonthDate, arbSpeciesGuess)
  .map(([date, guess]) => makeDraft(date, guess));

/**
 * Arbitrary for a sighting with no speciesGuess (should be excluded).
 */
const arbNoGuessSighting: fc.Arbitrary<CommunityDraft> = arbCurrentMonthDate.map(
  (date) => makeDraft(date, undefined),
);

/**
 * Arbitrary for a mixed array of sightings (current month, other months, no guess).
 */
const arbMixedSightings: fc.Arbitrary<CommunityDraft[]> = fc
  .tuple(
    fc.array(arbCurrentMonthSighting, { minLength: 0, maxLength: 15 }),
    fc.array(arbOtherMonthSighting, { minLength: 0, maxLength: 10 }),
    fc.array(arbNoGuessSighting, { minLength: 0, maxLength: 5 }),
  )
  .map(([current, other, noGuess]) => {
    const all = [...current, ...other, ...noGuess];
    // Shuffle deterministically by sorting on id
    return all.sort((a, b) => a.id.localeCompare(b.id));
  });

const arbTopN = fc.integer({ min: 1, max: 10 });

/** Empty known species — we test aggregation logic, not image matching. */
const emptyKnown: KnownSpeciesRecord[] = [];

describe('Feature: phase3-enhancements, Property 8: Trending species aggregation', () => {
  // ---------------------------------------------------------------------------
  // Property: Only current-month sightings are counted
  // ---------------------------------------------------------------------------
  it('only current-month sightings with a speciesGuess are counted', () => {
    fc.assert(
      fc.property(arbMixedSightings, arbTopN, (sightings, topN) => {
        const results = aggregateTrendingSpecies(sightings, emptyKnown, topN);

        // Manually count current-month sightings with a guess
        const currentMonthWithGuess = sightings.filter((s) => {
          if (!s.speciesGuess) return false;
          const d = new Date(s.createdAt);
          return (
            d.getFullYear() === currentYear && d.getMonth() === currentMonth
          );
        });

        // Total count from results should equal the number of current-month sightings with guesses
        // (but only up to topN groups — so we compare the full grouping)
        const totalFromResults = results.reduce((sum, r) => sum + r.count, 0);

        // Group the expected sightings case-insensitively
        const expectedGroups = new Map<string, number>();
        for (const s of currentMonthWithGuess) {
          const key = s.speciesGuess!.toLowerCase();
          expectedGroups.set(key, (expectedGroups.get(key) ?? 0) + 1);
        }

        // Sort expected groups by count descending, take topN
        const sortedExpected = Array.from(expectedGroups.values())
          .sort((a, b) => b - a)
          .slice(0, topN);
        const expectedTotal = sortedExpected.reduce(
          (sum, c) => sum + c,
          0,
        );

        expect(totalFromResults).toBe(expectedTotal);
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Results are grouped case-insensitively
  // ---------------------------------------------------------------------------
  it('results are grouped case-insensitively (no duplicate lowercase keys)', () => {
    fc.assert(
      fc.property(arbMixedSightings, arbTopN, (sightings, topN) => {
        const results = aggregateTrendingSpecies(sightings, emptyKnown, topN);

        const lowerKeys = results.map((r) => r.speciesGuess.toLowerCase());
        const uniqueKeys = new Set(lowerKeys);

        expect(lowerKeys.length).toBe(uniqueKeys.size);
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Results are sorted by count descending
  // ---------------------------------------------------------------------------
  it('results are sorted by count descending', () => {
    fc.assert(
      fc.property(arbMixedSightings, arbTopN, (sightings, topN) => {
        const results = aggregateTrendingSpecies(sightings, emptyKnown, topN);

        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].count).toBeGreaterThanOrEqual(
            results[i].count,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Results are capped at top N
  // ---------------------------------------------------------------------------
  it('results are capped at top N', () => {
    fc.assert(
      fc.property(arbMixedSightings, arbTopN, (sightings, topN) => {
        const results = aggregateTrendingSpecies(sightings, emptyKnown, topN);

        expect(results.length).toBeLessThanOrEqual(topN);
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Sightings from other months do not appear in results
  // ---------------------------------------------------------------------------
  it('sightings from other months do not inflate counts', () => {
    fc.assert(
      fc.property(
        fc.array(arbOtherMonthSighting, { minLength: 1, maxLength: 20 }),
        arbTopN,
        (otherMonthSightings, topN) => {
          const results = aggregateTrendingSpecies(
            otherMonthSightings,
            emptyKnown,
            topN,
          );

          // No sightings from other months should produce results
          expect(results).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
