/**
 * Phase 3.2 Property Test P10: Spore print matching
 *
 * For any extracted color, the spore print matcher SHALL:
 * - Return results sorted by ascending color distance
 * - Return at most topN results
 * - Calculate distance as Euclidean RGB distance
 *
 * Validates: Requirements 26.2, 26.3, 26.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  matchSporePrintColor,
  colorDistance,
  hexToRgb,
  rgbToHex,
  extractDominantColor,
  type SporePrintEntry,
} from '@/utils/sporePrintMatcher';

const rgbArb = fc.record({
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

const speciesColorArb = fc.record({
  speciesId: fc.uuid(),
  commonName: fc.string({ minLength: 3, maxLength: 30 }),
  sporePrintColor: fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  ).map(([r, g, b]) => rgbToHex(r, g, b)),
});

describe('Phase 3.2 Property P10: Spore print matching', () => {
  it('results are sorted by ascending color distance', () => {
    fc.assert(
      fc.property(
        rgbArb,
        fc.array(speciesColorArb, { minLength: 2, maxLength: 15 }),
        (extractedColor, speciesColors) => {
          const matches = matchSporePrintColor(extractedColor, speciesColors as SporePrintEntry[]);

          for (let i = 1; i < matches.length; i++) {
            expect(matches[i].colorDistance).toBeGreaterThanOrEqual(matches[i - 1].colorDistance);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns at most topN results', () => {
    fc.assert(
      fc.property(
        rgbArb,
        fc.array(speciesColorArb, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (extractedColor, speciesColors, topN) => {
          const matches = matchSporePrintColor(extractedColor, speciesColors as SporePrintEntry[], topN);
          expect(matches.length).toBeLessThanOrEqual(topN);
          expect(matches.length).toBeLessThanOrEqual(speciesColors.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('color distance is zero for identical colors', () => {
    fc.assert(
      fc.property(
        rgbArb,
        (color) => {
          expect(colorDistance(color, color)).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('color distance is symmetric', () => {
    fc.assert(
      fc.property(
        rgbArb,
        rgbArb,
        (a, b) => {
          expect(colorDistance(a, b)).toBeCloseTo(colorDistance(b, a), 10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('hex to rgb roundtrip is lossless', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          const hex = rgbToHex(r, g, b);
          const rgb = hexToRgb(hex);
          expect(rgb.r).toBe(r);
          expect(rgb.g).toBe(g);
          expect(rgb.b).toBe(b);
        },
      ),
      { numRuns: 100 },
    );
  });
});
