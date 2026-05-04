/**
 * Foraging Tips — Property-Based Test
 *
 * Feature: season-charts-voice-map, Property 7: Monthly foraging tips expert verification
 *
 * For all 12 monthly foraging tip entries, the tip text SHALL contain a
 * reference to expert verification (the word "expert" or the phrase
 * "qualified expert" or "verify").
 *
 * **Validates: Requirements 8.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { monthlyForagingTips } from '@/data/foragingTips';

// Feature: season-charts-voice-map, Property 7: Monthly foraging tips expert verification

const EXPERT_VERIFICATION_PATTERNS = [
  'qualified expert',
  'expert',
  'verify',
];

/**
 * Check whether a string contains at least one expert verification reference
 * (case-insensitive).
 */
function containsExpertReference(text: string): boolean {
  const lower = text.toLowerCase();
  return EXPERT_VERIFICATION_PATTERNS.some((pattern) => lower.includes(pattern));
}

describe('Feature: season-charts-voice-map, Property 7: Monthly foraging tips expert verification', () => {
  it('there are exactly 12 monthly foraging tip entries', () => {
    expect(monthlyForagingTips).toHaveLength(12);
  });

  it('every monthly foraging tip contains a reference to expert verification', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...monthlyForagingTips),
        (tip) => {
          const hasReference = containsExpertReference(tip.tip);
          expect(
            hasReference,
            `Month ${tip.month} tip is missing an expert verification reference. ` +
            `Expected one of: ${EXPERT_VERIFICATION_PATTERNS.map((p) => `"${p}"`).join(', ')}. ` +
            `Tip text: "${tip.tip.substring(0, 100)}…"`,
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
