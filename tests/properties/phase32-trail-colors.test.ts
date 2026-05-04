/**
 * Phase 3.2 Property Test P7: Trail condition colors
 *
 * For any TrailConditionCategory, the color mapping SHALL be:
 * - clear, dry → green
 * - issues, muddy, snowy → yellow
 * - bad-closed → red
 *
 * Validates: Requirements 10.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getCategoryColor } from '@/utils/trailConditionAggregator';
import type { TrailConditionCategory } from '@/types';

const ALL_CATEGORIES: TrailConditionCategory[] = ['clear', 'issues', 'bad-closed', 'dry', 'muddy', 'snowy'];

describe('Phase 3.2 Property P7: Trail condition colors', () => {
  it('clear and dry map to green', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('clear' as const, 'dry' as const),
        (category) => {
          expect(getCategoryColor(category)).toBe('green');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('issues, muddy, and snowy map to yellow', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('issues' as const, 'muddy' as const, 'snowy' as const),
        (category) => {
          expect(getCategoryColor(category)).toBe('yellow');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('bad-closed maps to red', () => {
    expect(getCategoryColor('bad-closed')).toBe('red');
  });

  it('every category maps to a valid color', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_CATEGORIES),
        (category) => {
          const color = getCategoryColor(category);
          expect(['green', 'yellow', 'red']).toContain(color);
        },
      ),
      { numRuns: 100 },
    );
  });
});
