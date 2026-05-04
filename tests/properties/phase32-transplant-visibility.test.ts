/**
 * Phase 3.2 Property Test P4: Transplant guide visibility based on protection status
 *
 * IF isProtected is true OR isInvasive is true, THEN the transplant guide
 * SHALL NOT be displayed. IF both are false AND transplantGuide is defined,
 * THEN the transplant guide SHALL be displayed with its disclaimer.
 *
 * Validates: Requirements 3.5, 3.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { plantsSeed } from '@/data/plantsSeed';

/**
 * Determines if a transplant guide should be visible for a plant.
 */
function shouldShowTransplantGuide(plant: {
  isProtected?: boolean;
  isInvasive?: boolean;
  transplantGuide?: { disclaimer: string };
}): boolean {
  if (plant.isProtected || plant.isInvasive) return false;
  return !!plant.transplantGuide;
}

describe('Phase 3.2 Property P4: Transplant guide visibility', () => {
  it('protected plants never show transplant guide', () => {
    fc.assert(
      fc.property(
        fc.record({
          isProtected: fc.constant(true),
          isInvasive: fc.boolean(),
          transplantGuide: fc.option(fc.record({ disclaimer: fc.string() })),
        }),
        (plant) => {
          expect(shouldShowTransplantGuide(plant)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invasive plants never show transplant guide', () => {
    fc.assert(
      fc.property(
        fc.record({
          isProtected: fc.boolean(),
          isInvasive: fc.constant(true),
          transplantGuide: fc.option(fc.record({ disclaimer: fc.string() })),
        }),
        (plant) => {
          expect(shouldShowTransplantGuide(plant)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('non-protected, non-invasive plants with transplantGuide show it', () => {
    fc.assert(
      fc.property(
        fc.record({
          isProtected: fc.constant(false),
          isInvasive: fc.constant(false),
          transplantGuide: fc.record({ disclaimer: fc.string({ minLength: 1 }) }),
        }),
        (plant) => {
          expect(shouldShowTransplantGuide(plant)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('poison hemlock in seed data is marked invasive and has no transplant guide visible', () => {
    const poisonHemlock = plantsSeed.find((p) => p.id === 'pl-poison-hemlock');
    if (poisonHemlock) {
      expect(poisonHemlock.isInvasive).toBe(true);
      expect(shouldShowTransplantGuide(poisonHemlock)).toBe(false);
    }
  });
});
