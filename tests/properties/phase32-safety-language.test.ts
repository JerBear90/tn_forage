/**
 * Phase 3.2 Property Test P1: Safety language compliance across all content
 *
 * For any record in blogArticles, plantsSeed, speciesSeed, guidedTours,
 * or any user-facing text field, no string-typed field value SHALL contain
 * the phrases "safe to eat", "definitely edible", "confirmed edible", or
 * "AI verified" (case-insensitive).
 *
 * Validates: Requirements 2.8, 3.9, 15.5, 25.7, 26.8, 29.8, 32.8
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { blogSeed } from '@/data/blogSeed';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';
import { tourSeed } from '@/data/tourSeed';

const FORBIDDEN_PHRASES = [
  'safe to eat',
  'definitely edible',
  'confirmed edible',
  'ai verified',
];

/**
 * Recursively extracts all string values from an object.
 */
function extractAllStrings(obj: unknown): string[] {
  const strings: string[] = [];
  if (typeof obj === 'string') {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      strings.push(...extractAllStrings(item));
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      strings.push(...extractAllStrings(value));
    }
  }
  return strings;
}

/**
 * Checks if a string contains any forbidden phrase.
 */
function containsForbiddenPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

describe('Phase 3.2 Property P1: Safety language compliance', () => {
  it('blogSeed contains no forbidden safety phrases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...blogSeed),
        (article) => {
          const allStrings = extractAllStrings(article);
          for (const str of allStrings) {
            const found = containsForbiddenPhrase(str);
            expect(found).toBeNull();
          }
        },
      ),
      { numRuns: blogSeed.length },
    );
  });

  it('speciesSeed contains no forbidden safety phrases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...speciesSeed),
        (species) => {
          const allStrings = extractAllStrings(species);
          for (const str of allStrings) {
            const found = containsForbiddenPhrase(str);
            expect(found).toBeNull();
          }
        },
      ),
      { numRuns: speciesSeed.length },
    );
  });

  it('plantsSeed contains no forbidden safety phrases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...plantsSeed),
        (plant) => {
          const allStrings = extractAllStrings(plant);
          for (const str of allStrings) {
            const found = containsForbiddenPhrase(str);
            expect(found).toBeNull();
          }
        },
      ),
      { numRuns: plantsSeed.length },
    );
  });

  it('tourSeed contains no forbidden safety phrases', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...tourSeed),
        (tour) => {
          const allStrings = extractAllStrings(tour);
          for (const str of allStrings) {
            const found = containsForbiddenPhrase(str);
            expect(found).toBeNull();
          }
        },
      ),
      { numRuns: tourSeed.length },
    );
  });
});
