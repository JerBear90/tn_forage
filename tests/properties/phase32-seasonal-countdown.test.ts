/**
 * Phase 3.2 Property Test P16: Seasonal countdown
 *
 * For any species with defined seasons:
 * - If currently in season, daysRemaining SHALL be 0 and isInSeason SHALL be true
 * - If not in season, daysRemaining SHALL be > 0 and isInSeason SHALL be false
 * - daysRemaining SHALL never be negative
 *
 * Validates: Requirements 31.2, 31.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateCountdown, daysUntilSeasonStart } from '@/utils/seasonalCountdown';

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

const speciesSeasonArb = fc.record({
  speciesId: fc.uuid(),
  commonName: fc.string({ minLength: 3, maxLength: 20 }),
  seasons: fc.subarray(SEASONS, { minLength: 1, maxLength: 4 }),
});

const dateArb = fc.date({ min: new Date(2025, 0, 1), max: new Date(2026, 11, 31), noInvalidDate: true });

describe('Phase 3.2 Property P16: Seasonal countdown', () => {
  it('daysRemaining is never negative', () => {
    fc.assert(
      fc.property(
        speciesSeasonArb,
        dateArb,
        (species, now) => {
          const result = calculateCountdown(species, now);
          expect(result.daysRemaining).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isInSeason is true when daysRemaining is 0', () => {
    fc.assert(
      fc.property(
        speciesSeasonArb,
        dateArb,
        (species, now) => {
          const result = calculateCountdown(species, now);
          if (result.daysRemaining === 0) {
            expect(result.isInSeason).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('isInSeason is false when daysRemaining > 0', () => {
    fc.assert(
      fc.property(
        speciesSeasonArb,
        dateArb,
        (species, now) => {
          const result = calculateCountdown(species, now);
          if (result.daysRemaining > 0) {
            expect(result.isInSeason).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('daysUntilSeasonStart returns 0 when currently in that season', () => {
    // March is in Spring (months 2-4)
    const marchDate = new Date(2025, 2, 15); // March 15
    expect(daysUntilSeasonStart(marchDate, 'Spring')).toBe(0);

    // July is in Summer (months 5-7)
    const julyDate = new Date(2025, 6, 15); // July 15
    expect(daysUntilSeasonStart(julyDate, 'Summer')).toBe(0);
  });

  it('daysUntilSeasonStart returns positive when not in season', () => {
    // January is not in Summer
    const janDate = new Date(2025, 0, 15); // January 15
    const days = daysUntilSeasonStart(janDate, 'Summer');
    expect(days).toBeGreaterThan(0);
  });
});
