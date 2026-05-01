/**
 * Review Service — Property-Based Tests
 *
 * Properties 7, 8, and 9 for the review service.
 *
 * - Property 7: Review storage round-trip
 * - Property 8: One review per user per target (idempotence)
 * - Property 9: Review sorting and pagination
 *
 * **Validates: Requirements 4.1, 4.2, 4.4**
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

/** Valid review text (10–200 chars, alphanumeric to avoid trim issues) */
const arbReviewText = fc
  .integer({ min: 10, max: 200 })
  .chain((len) =>
    fc.array(fc.integer({ min: 65, max: 122 }), { minLength: len, maxLength: len })
      .map((codes) => codes.map((c) => String.fromCharCode(c)).join('')),
  );

// ---------------------------------------------------------------------------
// Property 8: One review per user per target (idempotence)
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 8: One review per user per target', () => {
  it('Submitting two reviews for the same user-target pair results in exactly one stored review with the latest content', () => {
    fc.assert(
      fc.asyncProperty(
        arbUserId,
        arbTargetId,
        arbTargetType,
        arbRating,
        arbRating,
        arbReviewText,
        arbReviewText,
        arbAuthorName,
        async (userId, targetId, targetType, rating1, rating2, text1, text2, authorName) => {
          // Clear stores for each iteration
          await clearStore('reviews');
          await clearStore('syncQueue');

          // Submit first review
          await submitReview({
            userId,
            authorName,
            targetType,
            targetId,
            rating: rating1,
            text: text1,
          });

          // Submit second review (same user, same target)
          await submitReview({
            userId,
            authorName,
            targetType,
            targetId,
            rating: rating2,
            text: text2,
          });

          // Retrieve reviews for this target
          const reviews = await getReviews(targetType, targetId, 1);

          // Should be exactly 1 review
          expect(reviews).toHaveLength(1);

          // Should match the second (most recent) submission
          expect(reviews[0].userId).toBe(userId);
          expect(reviews[0].rating).toBe(rating2);
          expect(reviews[0].text).toBe(text2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Review sorting and pagination
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 9: Review sorting and pagination', () => {
  it('Reviews are returned in descending order by createdAt, with at most 10 per page', () => {
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 15 }),
        arbTargetId,
        arbTargetType,
        async (n, targetId, targetType) => {
          // Clear stores for each iteration
          await clearStore('reviews');
          await clearStore('syncQueue');

          // Submit N reviews with different userIds and staggered timestamps
          for (let i = 0; i < n; i++) {
            await submitReview({
              userId: `user-${i}-${targetId}`,
              authorName: `Author ${i}`,
              targetType,
              targetId,
              rating: (i % 5) + 1,
              text: `This is review number ${i} with enough text to pass validation`,
            });

            // Small delay to ensure distinct createdAt timestamps
            await new Promise((resolve) => setTimeout(resolve, 2));
          }

          // Page 1
          const page1 = await getReviews(targetType, targetId, 1);
          expect(page1.length).toBeLessThanOrEqual(10);

          // Verify descending order by createdAt
          for (let i = 1; i < page1.length; i++) {
            expect(page1[i - 1].createdAt >= page1[i].createdAt).toBe(true);
          }

          // If N > 10, page 2 should have the rest
          if (n > 10) {
            const page2 = await getReviews(targetType, targetId, 2);
            expect(page2.length).toBe(n - 10);

            // Page 2 should also be sorted descending
            for (let i = 1; i < page2.length; i++) {
              expect(page2[i - 1].createdAt >= page2[i].createdAt).toBe(true);
            }

            // Last item of page 1 should be >= first item of page 2
            expect(page1[page1.length - 1].createdAt >= page2[0].createdAt).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Review storage round-trip
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 7: Review storage round-trip', () => {
  it('Submitting a valid review and retrieving it returns matching userId, targetId, rating, and text', () => {
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

          // Submit review
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

          // Should find at least one review
          expect(reviews.length).toBeGreaterThanOrEqual(1);

          // Find the review we submitted
          const found = reviews.find((r) => r.userId === userId);
          expect(found).toBeDefined();
          expect(found!.userId).toBe(userId);
          expect(found!.targetId).toBe(targetId);
          expect(found!.targetType).toBe(targetType);
          expect(found!.rating).toBe(rating);
          expect(found!.text).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });
});
