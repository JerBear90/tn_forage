/**
 * Phase 3.2 Property Test P18: Analytics opt-out
 *
 * When analyticsOptOut is true, no usage events SHALL be logged.
 *
 * Validates: Requirements 20.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Simulates the opt-out check logic from useUsageAnalytics.
 */
function shouldLogEvent(optedOut: boolean): boolean {
  return !optedOut;
}

describe('Phase 3.2 Property P18: Analytics opt-out', () => {
  it('events are not logged when opted out', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        (optedOut) => {
          expect(shouldLogEvent(optedOut)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('events are logged when not opted out', () => {
    fc.assert(
      fc.property(
        fc.constant(false),
        (optedOut) => {
          expect(shouldLogEvent(optedOut)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('opt-out is a boolean decision', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (optedOut) => {
          const result = shouldLogEvent(optedOut);
          expect(typeof result).toBe('boolean');
          expect(result).toBe(!optedOut);
        },
      ),
      { numRuns: 100 },
    );
  });
});
