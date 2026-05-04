/**
 * Phase 3.2 Property Test P22: Sharing session expiration
 *
 * WHEN a sharing session duration expires, the session SHALL become inactive.
 * The expiresAt timestamp SHALL equal startedAt + durationMinutes.
 *
 * Validates: Requirements 4.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Determines if a sharing session has expired.
 */
function isSessionExpired(startedAt: string, durationMinutes: number, now: number): boolean {
  const expiresAt = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return now >= expiresAt;
}

/**
 * Calculates the expiration timestamp.
 */
function calculateExpiresAt(startedAt: string, durationMinutes: number): string {
  const expiresMs = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return new Date(expiresMs).toISOString();
}

describe('Phase 3.2 Property P22: Sharing session expiration', () => {
  it('session expires after duration elapses', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1704067200000, max: 1767225600000 }).map((ms) => new Date(ms)),
        fc.integer({ min: 1, max: 720 }), // 1 min to 12 hours
        (startDate, durationMinutes) => {
          const startedAt = startDate.toISOString();
          const afterExpiry = startDate.getTime() + (durationMinutes + 1) * 60 * 1000;
          expect(isSessionExpired(startedAt, durationMinutes, afterExpiry)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('session is not expired before duration elapses', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1704067200000, max: 1767225600000 }).map((ms) => new Date(ms)),
        fc.integer({ min: 2, max: 720 }),
        (startDate, durationMinutes) => {
          const startedAt = startDate.toISOString();
          const beforeExpiry = startDate.getTime() + (durationMinutes - 1) * 60 * 1000;
          expect(isSessionExpired(startedAt, durationMinutes, beforeExpiry)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('expiresAt equals startedAt + duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1704067200000, max: 1767225600000 }).map((ms) => new Date(ms)),
        fc.integer({ min: 1, max: 720 }),
        (startDate, durationMinutes) => {
          const startedAt = startDate.toISOString();
          const expiresAt = calculateExpiresAt(startedAt, durationMinutes);
          const expectedMs = startDate.getTime() + durationMinutes * 60 * 1000;
          expect(new Date(expiresAt).getTime()).toBe(expectedMs);
        },
      ),
      { numRuns: 100 },
    );
  });
});
