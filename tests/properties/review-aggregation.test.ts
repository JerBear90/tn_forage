/**
 * Review Aggregation Computation — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 13: Review aggregation computation
 *
 * For any non-empty array of integer ratings (each 1–5), the computed aggregation
 * shall have averageRating equal to the arithmetic mean rounded to one decimal place,
 * and totalCount equal to the array length.
 *
 * **Validates: Requirements 8.1**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { submitReview, getAggregation } from '@/social/reviewService';
import { clearStore } from '@/offline/db';
import type { ReviewTargetType } from '@/types';

// ---------------------------------------------------------------------------
// Setup — clear IndexedDB stores between tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStore('reviews');
  await clearStore('syncQueue');
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbTargetId = fc.uuid();
const arbTargetType = fc.constantFrom<ReviewTargetType>('park', 'trail', 'species');
const arbRating = fc.integer({ min: 1, max: 5 });

/** Array of 1–20 ratings, each 1–5 */
const arbRatings = fc.array(arbRating, { minLength: 1, maxLength: 20 });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 13: Review aggregation computation', () => {
  it('Aggregation averageRating equals arithmetic mean rounded to 1 decimal, totalCount equals array length', () => {
    fc.assert(
      fc.asyncProperty(
        arbRatings,
        arbTargetId,
        arbTargetType,
        async (ratings, targetId, targetType) => {
          // Clear stores for each iteration
          await clearStore('reviews');
          await clearStore('syncQueue');

          // Submit reviews from different users with the given ratings
          for (let i = 0; i < ratings.length; i++) {
            await submitReview({
              userId: `user-${i}-${targetId}`,
              authorName: `Author ${i}`,
              targetType,
              targetId,
              rating: ratings[i],
              text: `This is a valid review text for aggregation testing number ${i}`,
            });
          }

          // Get aggregation
          const agg = await getAggregation(targetType, targetId);

          // Compute expected average
          const sum = ratings.reduce((acc, r) => acc + r, 0);
          const expectedAvg = Math.round((sum / ratings.length) * 10) / 10;

          expect(agg.totalCount).toBe(ratings.length);
          expect(agg.averageRating).toBeCloseTo(expectedAvg, 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
