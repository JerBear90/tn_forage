/**
 * Hiking Time Estimation — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 12: Hiking time estimation
 *
 * For any non-negative distance in miles (d) and non-negative elevation gain
 * in feet (e), estimateHikingTime(d, e) shall return (d / 3) * 60 + (e / 1000) * 30.
 * Additionally, the function is monotonic: increasing distance or elevation gain
 * shall never decrease the estimated time.
 *
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { estimateHikingTime } from '@/utils/trailUtils';

// Feature: social-profile-and-park-details, Property 12: Hiking time estimation

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Non-negative distance/elevation values */
const arbNonNeg = fc.double({ min: 0, max: 1000, noNaN: true });

/** Values that may be negative (for clamping tests) */
const arbAny = fc.double({ min: -1000, max: 1000, noNaN: true });

/** Ordered pair where first < second, both non-negative */
const arbOrderedPair = fc
  .tuple(arbNonNeg, arbNonNeg)
  .filter(([a, b]) => a < b);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 12: Hiking time estimation', () => {
  it("Naismith's rule correctness: estimateHikingTime(d, e) === (d / 3) * 60 + (e / 1000) * 30", () => {
    fc.assert(
      fc.property(arbNonNeg, arbNonNeg, (d, e) => {
        const result = estimateHikingTime(d, e);
        const expected = (d / 3) * 60 + (e / 1000) * 30;
        expect(result).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 },
    );
  });

  it('Monotonicity in distance: for d1 < d2 and any e >= 0, time(d1, e) <= time(d2, e)', () => {
    fc.assert(
      fc.property(arbOrderedPair, arbNonNeg, ([d1, d2], e) => {
        expect(estimateHikingTime(d1, e)).toBeLessThanOrEqual(
          estimateHikingTime(d2, e),
        );
      }),
      { numRuns: 100 },
    );
  });

  it('Monotonicity in elevation: for any d >= 0 and e1 < e2, time(d, e1) <= time(d, e2)', () => {
    fc.assert(
      fc.property(arbNonNeg, arbOrderedPair, (d, [e1, e2]) => {
        expect(estimateHikingTime(d, e1)).toBeLessThanOrEqual(
          estimateHikingTime(d, e2),
        );
      }),
      { numRuns: 100 },
    );
  });

  it('Non-negativity: result is always >= 0 for any inputs', () => {
    fc.assert(
      fc.property(arbAny, arbAny, (d, e) => {
        expect(estimateHikingTime(d, e)).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });

  it('Zero identity: estimateHikingTime(0, 0) === 0', () => {
    expect(estimateHikingTime(0, 0)).toBe(0);
  });

  it('Negative clamping: result equals estimateHikingTime(max(0, d), max(0, e))', () => {
    fc.assert(
      fc.property(arbAny, arbAny, (d, e) => {
        const result = estimateHikingTime(d, e);
        const clamped = estimateHikingTime(Math.max(0, d), Math.max(0, e));
        expect(result).toBeCloseTo(clamped, 10);
      }),
      { numRuns: 100 },
    );
  });
});
