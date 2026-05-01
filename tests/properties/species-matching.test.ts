/**
 * Species Guess Matching — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 7: Species guess matching
 *
 * For any speciesGuess string and any set of known species/plant records,
 * the matching function shall return a species record if and only if the
 * speciesGuess matches a record's commonName via case-insensitive comparison.
 * When a match is found, the returned image shall be the first entry in that
 * record's images array.
 *
 * **Validates: Requirements 7.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  matchSpeciesImage,
  type KnownSpeciesRecord,
} from '@/services/trending';

// Feature: phase3-enhancements, Property 7: Species guess matching

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generate a non-empty common name string (1–30 alphanumeric/space chars).
 */
const ALPHA_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789';

const arbCommonName: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...ALPHA_CHARS.split('')), {
    minLength: 1,
    maxLength: 30,
  })
  .map((chars) => chars.join(''))
  .filter((s) => s.trim().length > 0);

/**
 * Generate a random image path array (0–3 entries).
 */
const PATH_CHARS = 'abcdefghijklmnopqrstuvwxyz-/';

const arbImages: fc.Arbitrary<string[]> = fc.array(
  fc
    .array(fc.constantFrom(...PATH_CHARS.split('')), {
      minLength: 5,
      maxLength: 40,
    })
    .map((chars) => chars.join('')),
  { minLength: 0, maxLength: 3 },
);

/**
 * Generate a single KnownSpeciesRecord.
 */
const arbSpeciesRecord: fc.Arbitrary<KnownSpeciesRecord> = fc
  .tuple(arbCommonName, arbImages)
  .map(([commonName, images]) => ({
    id: `sp-${commonName.toLowerCase().replace(/\s+/g, '-')}`,
    commonName,
    images,
  }));

/**
 * Generate an array of KnownSpeciesRecords with unique commonNames (case-insensitive).
 */
const arbSpeciesArray: fc.Arbitrary<KnownSpeciesRecord[]> = fc
  .array(arbSpeciesRecord, { minLength: 0, maxLength: 10 })
  .map((records) => {
    // Deduplicate by lowercase commonName to avoid ambiguous matches
    const seen = new Set<string>();
    return records.filter((r) => {
      const key = r.commonName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

/**
 * Apply a random case transformation to a string.
 */
function applyCaseVariation(s: string, variant: number): string {
  switch (variant % 4) {
    case 0:
      return s; // original
    case 1:
      return s.toLowerCase();
    case 2:
      return s.toUpperCase();
    case 3:
      // Mixed case: alternate chars
      return s
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
        .join('');
    default:
      return s;
  }
}

const arbCaseVariant = fc.integer({ min: 0, max: 3 });

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Feature: phase3-enhancements, Property 7: Species guess matching', () => {
  // ---------------------------------------------------------------------------
  // Property: Match returns a result iff case-insensitive commonName matches
  // ---------------------------------------------------------------------------
  it('returns a match iff speciesGuess matches a commonName case-insensitively', () => {
    fc.assert(
      fc.property(
        arbSpeciesArray,
        arbCommonName,
        arbCaseVariant,
        (species, rawGuess, caseVariant) => {
          const guess = applyCaseVariation(rawGuess, caseVariant);
          const result = matchSpeciesImage(guess, species);

          const expectedMatch = species.find(
            (s) => s.commonName.toLowerCase() === guess.toLowerCase(),
          );

          if (expectedMatch) {
            expect(result).toBeDefined();
            expect(result!.id).toBe(expectedMatch.id);
          } else {
            expect(result).toBeUndefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: When a known name is guessed with any case, it always matches
  // ---------------------------------------------------------------------------
  it('always matches when guess is a case variation of a known commonName', () => {
    fc.assert(
      fc.property(
        arbSpeciesArray.filter((arr) => arr.length > 0),
        arbCaseVariant,
        (species, caseVariant) => {
          // Pick a random species from the array
          const target = species[0];
          const guess = applyCaseVariation(target.commonName, caseVariant);

          const result = matchSpeciesImage(guess, species);

          expect(result).toBeDefined();
          expect(result!.id).toBe(target.id);
        },
      ),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Returned image is the first in the images array
  // ---------------------------------------------------------------------------
  it('returned image is the first entry in the matched record images array', () => {
    fc.assert(
      fc.property(
        arbSpeciesArray.filter((arr) => arr.length > 0),
        arbCaseVariant,
        (species, caseVariant) => {
          const target = species[0];
          const guess = applyCaseVariation(target.commonName, caseVariant);

          const result = matchSpeciesImage(guess, species);

          expect(result).toBeDefined();

          if (target.images.length > 0) {
            expect(result!.image).toBe(target.images[0]);
          } else {
            expect(result!.image).toBeUndefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: Empty guess always returns undefined
  // ---------------------------------------------------------------------------
  it('empty guess always returns undefined', () => {
    fc.assert(
      fc.property(arbSpeciesArray, (species) => {
        const result = matchSpeciesImage('', species);
        expect(result).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  // ---------------------------------------------------------------------------
  // Property: No match for a guess that differs from all commonNames
  // ---------------------------------------------------------------------------
  it('returns undefined when guess does not match any commonName', () => {
    fc.assert(
      fc.property(arbSpeciesArray, (species) => {
        // Use a sentinel string that cannot match any generated commonName
        const uniqueGuess = '___ZZZZZ_NO_MATCH___';
        const result = matchSpeciesImage(uniqueGuess, species);
        expect(result).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });
});
