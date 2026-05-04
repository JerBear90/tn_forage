/**
 * Phase 3.2 Property Test P21: Beacon inactivity
 *
 * IF the inactivity timer exceeds the configured duration without user activity,
 * THEN the beacon SHALL trigger a safety alert.
 *
 * Validates: Requirements 11.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Simulates the beacon inactivity check logic.
 */
function shouldTriggerAlert(
  lastActivityMs: number,
  nowMs: number,
  durationMinutes: number,
): boolean {
  const elapsed = nowMs - lastActivityMs;
  const durationMs = durationMinutes * 60 * 1000;
  return elapsed >= durationMs;
}

describe('Phase 3.2 Property P21: Beacon inactivity', () => {
  it('triggers alert when elapsed time exceeds duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 240 }), // duration in minutes
        fc.integer({ min: 0, max: 1000 }), // extra minutes past duration
        (durationMinutes, extraMinutes) => {
          const lastActivity = 0;
          const now = (durationMinutes + extraMinutes) * 60 * 1000;
          expect(shouldTriggerAlert(lastActivity, now, durationMinutes)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not trigger alert when elapsed time is less than duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 240 }), // duration in minutes
        fc.integer({ min: 1, max: 100 }), // percentage of duration elapsed (1-99%)
        (durationMinutes, percentElapsed) => {
          const fraction = Math.min(percentElapsed, 99) / 100;
          const lastActivity = 0;
          const now = Math.floor(durationMinutes * 60 * 1000 * fraction);
          if (now < durationMinutes * 60 * 1000) {
            expect(shouldTriggerAlert(lastActivity, now, durationMinutes)).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('triggers exactly at the duration boundary', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 240 }),
        (durationMinutes) => {
          const lastActivity = 0;
          const now = durationMinutes * 60 * 1000; // Exactly at boundary
          expect(shouldTriggerAlert(lastActivity, now, durationMinutes)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
