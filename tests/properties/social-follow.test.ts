/**
 * Follow Service — Property-Based Tests
 *
 * Properties 1 and 2 for the follow service.
 *
 * - Property 1: Follow/unfollow round-trip
 * - Property 2: Self-follow prevention
 *
 * **Validates: Requirements 1.1, 1.2, 1.6**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { followUser, unfollowUser, isFollowing } from '@/social/followService';
import { clearStore } from '@/offline/db';

// ---------------------------------------------------------------------------
// Setup — clear IndexedDB stores between tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStore('follows');
  await clearStore('syncQueue');
});

// ---------------------------------------------------------------------------
// Property 1: Follow/unfollow round-trip
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 1: Follow/unfollow round-trip', () => {
  it('For any two distinct user IDs, followUser then isFollowing returns true, unfollowUser then isFollowing returns false', () => {
    fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
        async ([userA, userB]) => {
          // Clear stores for each iteration
          await clearStore('follows');
          await clearStore('syncQueue');

          // Follow: A follows B
          const followResult = await followUser(userA, userB);
          expect(followResult).toBe(true);

          // isFollowing should return true
          const isFollowingAfterFollow = await isFollowing(userA, userB);
          expect(isFollowingAfterFollow).toBe(true);

          // Unfollow: A unfollows B
          const unfollowResult = await unfollowUser(userA, userB);
          expect(unfollowResult).toBe(true);

          // isFollowing should return false
          const isFollowingAfterUnfollow = await isFollowing(userA, userB);
          expect(isFollowingAfterUnfollow).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Self-follow prevention
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 2: Self-follow prevention', () => {
  it('For any user ID, followUser(userId, userId) returns false and isFollowing(userId, userId) returns false', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Clear stores for each iteration
          await clearStore('follows');
          await clearStore('syncQueue');

          // Attempt self-follow
          const followResult = await followUser(userId, userId);
          expect(followResult).toBe(false);

          // isFollowing should return false
          const following = await isFollowing(userId, userId);
          expect(following).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
