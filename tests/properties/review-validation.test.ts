/**
 * Review Text Length Validation — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 10: Review text length validation
 *
 * For any string, validateReviewText shall return { valid: true } if and only if
 * the trimmed string length is between 10 and 2000 characters inclusive.
 * Strings outside this range shall be rejected with an appropriate error message.
 *
 * **Validates: Requirements 4.6, 4.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateReviewText } from '@/social/reviewService';

// Feature: social-profile-and-park-details, Property 10: Review text length validation

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a string of exact length using alphanumeric characters */
function arbStringOfLength(min: number, max: number): fc.Arbitrary<string> {
  return fc.integer({ min, max }).chain((len) =>
    fc.array(fc.integer({ min: 65, max: 122 }), { minLength: len, maxLength: len })
      .map((codes) => codes.map((c) => String.fromCharCode(c)).join('')),
  );
}

/** String whose trimmed length is between 10 and 2000 (valid range) */
const arbValidText = arbStringOfLength(10, 2000);

/** String whose trimmed length is 1–9 (too short) */
const arbTooShortText = arbStringOfLength(1, 9);

/** String whose trimmed length is 2001–2500 (too long) */
const arbTooLongText = arbStringOfLength(2001, 2100);

/** Whitespace-only strings (trimmed length is 0) */
const arbWhitespaceOnly = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 9 })
  .map((chars) => chars.join(''));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 10: Review text length validation', () => {
  it('Strings with trimmed length 10–2000 → valid: true', () => {
    fc.assert(
      fc.property(arbValidText, (text) => {
        const result = validateReviewText(text);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('Strings with trimmed length < 10 → valid: false with error about minimum', () => {
    fc.assert(
      fc.property(arbTooShortText, (text) => {
        const result = validateReviewText(text);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.toLowerCase()).toContain('at least 10');
      }),
      { numRuns: 100 },
    );
  });

  it('Strings with trimmed length > 2000 → valid: false with error about maximum', () => {
    fc.assert(
      fc.property(arbTooLongText, (text) => {
        const result = validateReviewText(text);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.toLowerCase()).toContain('2000');
      }),
      { numRuns: 100 },
    );
  });

  it('Whitespace-only strings shorter than 10 chars → valid: false (trimmed length is 0)', () => {
    fc.assert(
      fc.property(arbWhitespaceOnly, (text) => {
        const result = validateReviewText(text);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});
