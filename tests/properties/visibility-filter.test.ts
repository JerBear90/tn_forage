/**
 * Visibility Filter — Property-Based Tests
 *
 * Property 11: Visibility filtering
 *
 * **Validates: Requirements 5.5, 13.4, 15.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterPublicItems } from '@/social/visibilityFilter';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Generate an item with a random visibility value.
 */
const visibilityItemArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  visibility: fc.constantFrom('private' as const, 'public' as const),
});

// ---------------------------------------------------------------------------
// Property 11: Visibility filtering
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 11: Visibility filtering', () => {
  it('For any set of items with mixed visibility values, filterPublicItems shall return only items with visibility === "public"', () => {
    fc.assert(
      fc.property(
        fc.array(visibilityItemArb, { minLength: 0, maxLength: 50 }),
        (items) => {
          const result = filterPublicItems(items);

          // All returned items must be public
          for (const item of result) {
            expect(item.visibility).toBe('public');
          }

          // Count of returned items must match count of public items in input
          const expectedPublicCount = items.filter(
            (i) => i.visibility === 'public',
          ).length;
          expect(result.length).toBe(expectedPublicCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('No private items shall be present in the filtered result', () => {
    fc.assert(
      fc.property(
        fc.array(visibilityItemArb, { minLength: 1, maxLength: 50 }),
        (items) => {
          const result = filterPublicItems(items);

          // No private items in result
          const privateItems = result.filter(
            (item) => item.visibility === 'private',
          );
          expect(privateItems.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('All public items from the input shall be present in the filtered result', () => {
    fc.assert(
      fc.property(
        fc.array(visibilityItemArb, { minLength: 0, maxLength: 50 }),
        (items) => {
          const result = filterPublicItems(items);
          const resultIds = new Set(result.map((r) => r.id));

          // Every public item from input must be in the result
          for (const item of items) {
            if (item.visibility === 'public') {
              expect(resultIds.has(item.id)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
