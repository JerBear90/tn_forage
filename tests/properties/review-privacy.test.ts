/**
 * Review Privacy — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 19: Review privacy
 *
 * For any review returned by getReviews, the review object shall contain
 * an authorName field but shall not contain the author's email address
 * or GPS coordinates.
 *
 * **Validates: Requirements 15.5**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { submitReview, getReviews } from '@/social/reviewService';
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

const arbUserId = fc.uuid();
const arbTargetId = fc.uuid();
const arbTargetType = fc.constantFrom<ReviewTargetType>('park', 'trail', 'species');
const arbRating = fc.integer({ min: 1, max: 5 });
const arbAuthorName = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** Valid review text (10–200 chars, alphanumeric) */
const arbReviewText = fc
  .integer({ min: 10, max: 200 })
  .chain((len) =>
    fc.array(fc.integer({ min: 65, max: 122 }), { minLength: len, maxLength: len })
      .map((codes) => codes.map((c) => String.fromCharCode(c)).join('')),
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 19: Review privacy', () => {
  it('Each review has authorName but no email, coordinates, gpsCoordinates, lat, or lng fields', () => {
    fc.assert(
      fc.asyncProperty(
        arbUserId,
        arbTargetId,
        arbTargetType,
        arbRating,
        arbReviewText,
        arbAuthorName,
        async (userId, targetId, targetType, rating, text, authorName) => {
          // Clear stores for each iteration
          await clearStore('reviews');
          await clearStore('syncQueue');

          // Submit a review
          await submitReview({
            userId,
            authorName,
            targetType,
            targetId,
            rating,
            text,
          });

          // Retrieve reviews
          const reviews = await getReviews(targetType, targetId, 1);
          expect(reviews.length).toBeGreaterThanOrEqual(1);

          for (const review of reviews) {
            // Must have authorName
            expect(review).toHaveProperty('authorName');
            expect(typeof review.authorName).toBe('string');
            expect(review.authorName.length).toBeGreaterThan(0);

            // Must NOT have email
            expect(review).not.toHaveProperty('email');

            // Must NOT have GPS coordinate fields
            expect(review).not.toHaveProperty('coordinates');
            expect(review).not.toHaveProperty('gpsCoordinates');
            expect(review).not.toHaveProperty('lat');
            expect(review).not.toHaveProperty('lng');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
