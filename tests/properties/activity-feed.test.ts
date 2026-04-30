/**
 * Activity Feed Service — Property-Based Tests
 *
 * Properties 3 and 4 for the activity feed service.
 *
 * - Property 3: Feed reverse-chronological ordering
 * - Property 4: Feed pagination cap
 *
 * **Validates: Requirements 2.1, 2.6**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getFeed } from '@/social/activityFeedService';
import { putRecord, clearStore } from '@/offline/db';
import type { FeedItemLocal, FeedActionType } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CURRENT_USER_ID = 'current-user';
const FOLLOWED_USER_ID = 'followed-user';

const ACTION_TYPES: FeedActionType[] = [
  'review_posted',
  'photo_shared',
  'trip_completed',
  'achievement_earned',
];

// ---------------------------------------------------------------------------
// Setup — clear IndexedDB stores between tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStore('feedItems');
  await clearStore('follows');
  await clearStore('syncQueue');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a follow relationship so the current user follows the target user.
 */
async function createFollow(followerId: string, followedId: string): Promise<void> {
  await putRecord('follows', {
    id: crypto.randomUUID(),
    followerId,
    followedId,
    createdAt: new Date().toISOString(),
    syncStatus: 'synced',
  });
}

/**
 * Create a feed item in IndexedDB.
 */
async function createFeedItem(
  userId: string,
  createdAt: string,
  actionType: FeedActionType = 'trip_completed',
): Promise<FeedItemLocal> {
  const item: FeedItemLocal = {
    id: crypto.randomUUID(),
    userId,
    userName: 'Test User',
    actionType,
    targetType: 'park',
    targetId: `park-${crypto.randomUUID()}`,
    targetName: 'Test Park',
    createdAt,
  };
  await putRecord('feedItems', item);
  return item;
}

// ---------------------------------------------------------------------------
// Property 3: Feed reverse-chronological ordering
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 3: Feed reverse-chronological ordering', () => {
  it('For any set of feed items with distinct timestamps, getFeed shall return them in strictly descending order by createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.tuple(
            fc.integer({ min: 1577836800000, max: 1924991999000 }), // 2020-01-01 to 2030-12-31 in ms
            fc.constantFrom(...ACTION_TYPES),
          ),
          { minLength: 2, maxLength: 20 },
        ),
        async (itemSpecs) => {
          // Clear stores for each iteration
          await clearStore('feedItems');
          await clearStore('follows');

          // Create follow relationship
          await createFollow(CURRENT_USER_ID, FOLLOWED_USER_ID);

          // Ensure distinct timestamps by adding index offset
          const distinctTimestamps = itemSpecs.map(([ms, _], index) => ms + index);

          // Create feed items with distinct timestamps
          for (let i = 0; i < itemSpecs.length; i++) {
            await createFeedItem(
              FOLLOWED_USER_ID,
              new Date(distinctTimestamps[i]).toISOString(),
              itemSpecs[i][1],
            );
          }

          // Fetch feed (page 1, large page size to get all)
          const feed = await getFeed(CURRENT_USER_ID, 1, 100);

          // Verify descending order by createdAt
          for (let i = 1; i < feed.length; i++) {
            expect(feed[i - 1].createdAt >= feed[i].createdAt).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Feed pagination cap
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 4: Feed pagination cap', () => {
  it('For any number of feed items N >= 0, a single call to getFeed with default page size shall return at most 20 items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        async (n) => {
          // Clear stores for each iteration
          await clearStore('feedItems');
          await clearStore('follows');

          // Create follow relationship
          await createFollow(CURRENT_USER_ID, FOLLOWED_USER_ID);

          // Create N feed items
          for (let i = 0; i < n; i++) {
            const date = new Date(2024, 0, 1, 0, 0, 0, i);
            await createFeedItem(
              FOLLOWED_USER_ID,
              date.toISOString(),
            );
          }

          // Fetch feed with default page size (20)
          const feed = await getFeed(CURRENT_USER_ID, 1);

          // Verify at most 20 items returned
          expect(feed.length).toBeLessThanOrEqual(20);

          // Verify correct count: min(n, 20)
          expect(feed.length).toBe(Math.min(n, 20));
        },
      ),
      { numRuns: 100 },
    );
  });
});
