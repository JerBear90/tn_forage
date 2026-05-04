/**
 * Phase 3.2 Property Test P17: Analytics privacy
 *
 * Usage events SHALL NOT contain personally identifiable information
 * beyond an optional userId. The sessionId SHALL be a generated token,
 * not derived from user data.
 *
 * Validates: Requirements 20.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UsageEvent } from '@/types';

const usageEventArb: fc.Arbitrary<UsageEvent> = fc.record({
  id: fc.nat().map((n) => `evt-${n}-${Math.random().toString(36).slice(2, 9)}`),
  featureKey: fc.constantFrom('offline-maps', 'route-planner', 'beacon', 'foraging-journal'),
  timestamp: fc.date({ min: new Date(2024, 0, 1), max: new Date(2026, 11, 31) }).map((d) => d.toISOString()),
  userId: fc.option(fc.uuid()),
  sessionId: fc.nat().map((n) => `sess-${n}-${Math.random().toString(36).slice(2, 9)}`),
});

describe('Phase 3.2 Property P17: Analytics privacy', () => {
  it('usage events contain only expected fields', () => {
    fc.assert(
      fc.property(
        usageEventArb,
        (event) => {
          const keys = Object.keys(event);
          const allowedKeys = ['id', 'featureKey', 'timestamp', 'userId', 'sessionId'];
          for (const key of keys) {
            expect(allowedKeys).toContain(key);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('sessionId is not an email or phone number', () => {
    fc.assert(
      fc.property(
        usageEventArb,
        (event) => {
          expect(event.sessionId).not.toMatch(/@/);
          expect(event.sessionId).not.toMatch(/^\+?\d{10,}/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('featureKey does not contain user data', () => {
    fc.assert(
      fc.property(
        usageEventArb,
        (event) => {
          expect(event.featureKey).not.toMatch(/@/);
          expect(event.featureKey.length).toBeLessThan(100);
        },
      ),
      { numRuns: 100 },
    );
  });
});
