/**
 * Phase 3.2 Property Test P13: Microhabitat success rate
 *
 * For any microhabitat pin with visits, the success rate SHALL be
 * (visits where speciesFound is true / total visits) * 100, rounded.
 *
 * Validates: Requirements 28.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { MicrohabitatVisit } from '@/types';

function calculateSuccessRate(visits: MicrohabitatVisit[]): number {
  if (visits.length === 0) return 0;
  const successCount = visits.filter((v) => v.speciesFound).length;
  return Math.round((successCount / visits.length) * 100);
}

const visitArb: fc.Arbitrary<MicrohabitatVisit> = fc.record({
  date: fc.date().map((d) => d.toISOString().split('T')[0]),
  speciesFound: fc.boolean(),
  notes: fc.option(fc.string({ maxLength: 50 })),
});

describe('Phase 3.2 Property P13: Microhabitat success rate', () => {
  it('success rate is 0 for empty visits', () => {
    expect(calculateSuccessRate([])).toBe(0);
  });

  it('success rate is between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.array(visitArb, { minLength: 1, maxLength: 50 }),
        (visits) => {
          const rate = calculateSuccessRate(visits);
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('success rate is 100 when all visits found species', () => {
    fc.assert(
      fc.property(
        fc.array(visitArb, { minLength: 1, maxLength: 20 }),
        (visits) => {
          const allSuccess = visits.map((v) => ({ ...v, speciesFound: true }));
          expect(calculateSuccessRate(allSuccess)).toBe(100);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('success rate is 0 when no visits found species', () => {
    fc.assert(
      fc.property(
        fc.array(visitArb, { minLength: 1, maxLength: 20 }),
        (visits) => {
          const noSuccess = visits.map((v) => ({ ...v, speciesFound: false }));
          expect(calculateSuccessRate(noSuccess)).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
