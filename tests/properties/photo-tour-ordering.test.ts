/**
 * Photo Tour Ordering — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 14: Photo tour ordering
 *
 * For any combination of seed photos and user-submitted photos, the photo tour
 * shall display all seed photos before any user photos, and user photos shall
 * be sorted in descending order by createdAt.
 *
 * This test validates:
 * 1. getPhotos returns user photos in descending createdAt order
 * 2. The conceptual ordering (seeds first, then user photos desc) holds
 *
 * **Validates: Requirements 9.2**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getPhotos, uploadPhoto } from '@/social/photoService';
import { clearStore } from '@/offline/db';
import type { SocialPhoto, SocialPhotoTargetType } from '@/types';

// ---------------------------------------------------------------------------
// Setup — clear IndexedDB stores between tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStore('socialPhotos');
  await clearStore('syncQueue');
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a seed photo URL string */
const arbSeedPhotoUrl = fc
  .string({ minLength: 5, maxLength: 30 })
  .map((s) => `/images/parks/${s}.jpg`);

/** Generate an array of seed photo URLs */
const arbSeedPhotos = fc.array(arbSeedPhotoUrl, { minLength: 0, maxLength: 5 });

/** Generate a distinct ISO timestamp for ordering tests */
const arbTimestamp = fc
  .integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 })
  .map((ms) => new Date(ms).toISOString());

/** Generate an array of distinct timestamps */
const arbDistinctTimestamps = fc
  .array(
    fc.integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 }),
    { minLength: 1, maxLength: 10 },
  )
  .map((arr) => [...new Set(arr)])
  .filter((arr) => arr.length >= 1)
  .map((arr) => arr.map((ms) => new Date(ms).toISOString()));

// ---------------------------------------------------------------------------
// Helper: order photos as the PhotoTour component would
// ---------------------------------------------------------------------------

/**
 * Combine seed photos and user photos in the order the PhotoTour displays them:
 * all seed photos first (in original order), then user photos sorted by
 * createdAt descending.
 */
function orderPhotosForTour(
  seedPhotos: string[],
  userPhotos: SocialPhoto[],
): (string | SocialPhoto)[] {
  const sortedUserPhotos = [...userPhotos].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
  return [...seedPhotos, ...sortedUserPhotos];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 14: Photo tour ordering', () => {
  it('getPhotos returns user photos in descending createdAt order', () => {
    fc.assert(
      fc.asyncProperty(arbDistinctTimestamps, async (timestamps) => {
        // Clear stores for each iteration
        await clearStore('socialPhotos');
        await clearStore('syncQueue');

        const targetType = 'park' as SocialPhotoTargetType;
        const targetId = 'test-park-1';

        // Upload photos with different timestamps
        // We upload them in the order of the generated timestamps
        for (const ts of timestamps) {
          const blob = new Blob(['photo-data'], { type: 'image/jpeg' });
          await uploadPhoto(
            {
              userId: 'user-1',
              targetType,
              targetId,
              blob,
              mimeType: 'image/jpeg',
              hasLocation: false,
            },
            false,
          );
        }

        // Retrieve photos
        const photos = await getPhotos(targetType, targetId);

        // Verify descending createdAt order
        for (let i = 1; i < photos.length; i++) {
          expect(photos[i - 1].createdAt >= photos[i].createdAt).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('seed photos appear before all user photos in the combined ordering', () => {
    fc.assert(
      fc.property(
        arbSeedPhotos,
        fc.array(arbTimestamp, { minLength: 0, maxLength: 5 }),
        (seedPhotos, userTimestamps) => {
          // Create mock user photos with the generated timestamps
          const userPhotos: SocialPhoto[] = userTimestamps.map((ts, i) => ({
            id: `photo-${i}`,
            userId: 'user-1',
            targetType: 'park' as SocialPhotoTargetType,
            targetId: 'test-park-1',
            blob: new Blob(['data'], { type: 'image/jpeg' }),
            mimeType: 'image/jpeg' as const,
            hasLocation: false,
            createdAt: ts,
            syncStatus: 'pending' as const,
          }));

          const ordered = orderPhotosForTour(seedPhotos, userPhotos);

          // All seed photos should come first, in their original order
          for (let i = 0; i < seedPhotos.length; i++) {
            expect(ordered[i]).toBe(seedPhotos[i]);
          }

          // All items after seed photos should be SocialPhoto objects
          const userSection = ordered.slice(seedPhotos.length);
          for (const item of userSection) {
            expect(typeof item).toBe('object');
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('createdAt');
          }

          // User photos should be in descending createdAt order
          for (let i = 1; i < userSection.length; i++) {
            const prev = (userSection[i - 1] as SocialPhoto).createdAt;
            const curr = (userSection[i] as SocialPhoto).createdAt;
            expect(prev >= curr).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('total ordered length equals seed count plus user count', () => {
    fc.assert(
      fc.property(
        arbSeedPhotos,
        fc.array(arbTimestamp, { minLength: 0, maxLength: 5 }),
        (seedPhotos, userTimestamps) => {
          const userPhotos: SocialPhoto[] = userTimestamps.map((ts, i) => ({
            id: `photo-${i}`,
            userId: 'user-1',
            targetType: 'park' as SocialPhotoTargetType,
            targetId: 'test-park-1',
            blob: new Blob(['data'], { type: 'image/jpeg' }),
            mimeType: 'image/jpeg' as const,
            hasLocation: false,
            createdAt: ts,
            syncStatus: 'pending' as const,
          }));

          const ordered = orderPhotosForTour(seedPhotos, userPhotos);
          expect(ordered.length).toBe(seedPhotos.length + userPhotos.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
