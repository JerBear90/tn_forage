/**
 * Phase 3.2 Property Test P11: Sustainability level
 *
 * For any harvest count, the sustainability level SHALL be:
 * - green: count <= 2
 * - yellow: count <= 4
 * - red: count > 4
 *
 * Validates: Requirements 27.2, 27.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateSustainabilityLevel } from '@/utils/harvestSustainability';

describe('Phase 3.2 Property P11: Sustainability level', () => {
  it('returns green for harvest counts 0-2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        (count) => {
          expect(calculateSustainabilityLevel(count)).toBe('green');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns yellow for harvest counts 3-4', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 4 }),
        (count) => {
          expect(calculateSustainabilityLevel(count)).toBe('yellow');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns red for harvest counts > 4', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 1000 }),
        (count) => {
          expect(calculateSustainabilityLevel(count)).toBe('red');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('always returns a valid sustainability level', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }),
        (count) => {
          const level = calculateSustainabilityLevel(count);
          expect(['green', 'yellow', 'red']).toContain(level);
        },
      ),
      { numRuns: 100 },
    );
  });
});
