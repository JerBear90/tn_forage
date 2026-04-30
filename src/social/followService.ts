/**
 * ForageFlow — Follow Service
 *
 * Handles directional follow relationships between users.
 * All data is persisted to IndexedDB and queued for sync when offline.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6
 */

import { getDB, putRecord, deleteRecord } from '@/offline/db';
import type { FollowLocal, SyncStatus } from '@/types';

// ---------------------------------------------------------------------------
// Follow a user
// ---------------------------------------------------------------------------

/**
 * Create a directional follow relationship from currentUserId to targetUserId.
 *
 * - Returns false if attempting to self-follow (Requirement 1.6).
 * - Idempotent: returns true if already following.
 * - Saves to IndexedDB `follows` store and enqueues in `syncQueue`.
 *
 * @param currentUserId - The user initiating the follow
 * @param targetUserId  - The user being followed
 * @returns true if the follow was created or already exists, false if self-follow
 */
export async function followUser(
  currentUserId: string,
  targetUserId: string,
): Promise<boolean> {
  // Prevent self-follow
  if (currentUserId === targetUserId) {
    return false;
  }

  const db = await getDB();

  // Check if already following (avoid duplicates)
  const existingFollows = await db.getAllFromIndex(
    'follows',
    'by-followerId',
    currentUserId,
  );
  const alreadyFollowing = existingFollows.find(
    (f) => f.followedId === targetUserId,
  );

  if (alreadyFollowing) {
    return true; // Idempotent
  }

  const now = new Date().toISOString();

  // Create the follow record
  const follow: FollowLocal = {
    id: crypto.randomUUID(),
    followerId: currentUserId,
    followedId: targetUserId,
    createdAt: now,
    syncStatus: 'pending' as SyncStatus,
  };

  // Persist to IndexedDB follows store
  await putRecord('follows', follow);

  // Enqueue in sync queue for offline-first sync
  await putRecord('syncQueue', {
    localId: crypto.randomUUID(),
    serverId: undefined,
    userId: currentUserId,
    collection: 'follows',
    operation: 'create',
    payload: follow,
    payloadHash: '',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    retryCount: 0,
    clientVersion: 1,
  });

  return true;
}

// ---------------------------------------------------------------------------
// Unfollow a user
// ---------------------------------------------------------------------------

/**
 * Remove a directional follow relationship from currentUserId to targetUserId.
 *
 * @param currentUserId - The user initiating the unfollow
 * @param targetUserId  - The user being unfollowed
 * @returns true if the follow was removed, false if not found
 */
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const db = await getDB();

  // Find the follow record
  const existingFollows = await db.getAllFromIndex(
    'follows',
    'by-followerId',
    currentUserId,
  );
  const follow = existingFollows.find((f) => f.followedId === targetUserId);

  if (!follow) {
    return false;
  }

  const now = new Date().toISOString();

  // Delete from IndexedDB follows store
  await deleteRecord('follows', follow.id);

  // Enqueue delete in sync queue
  await putRecord('syncQueue', {
    localId: crypto.randomUUID(),
    serverId: undefined,
    userId: currentUserId,
    collection: 'follows',
    operation: 'delete',
    payload: follow,
    payloadHash: '',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    retryCount: 0,
    clientVersion: 1,
  });

  return true;
}

// ---------------------------------------------------------------------------
// Check if following
// ---------------------------------------------------------------------------

/**
 * Check whether currentUserId follows targetUserId.
 *
 * @param currentUserId - The potential follower
 * @param targetUserId  - The potentially followed user
 * @returns true if currentUserId follows targetUserId
 */
export async function isFollowing(
  currentUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const db = await getDB();

  const follows = await db.getAllFromIndex(
    'follows',
    'by-followerId',
    currentUserId,
  );

  return follows.some((f) => f.followedId === targetUserId);
}

// ---------------------------------------------------------------------------
// Follower count
// ---------------------------------------------------------------------------

/**
 * Get the number of followers for a user.
 *
 * @param userId - The user whose follower count to retrieve
 * @returns The number of users following this user
 */
export async function getFollowerCount(userId: string): Promise<number> {
  const db = await getDB();

  const followers = await db.getAllFromIndex(
    'follows',
    'by-followedId',
    userId,
  );

  return followers.length;
}

// ---------------------------------------------------------------------------
// Following count
// ---------------------------------------------------------------------------

/**
 * Get the number of users that a user is following.
 *
 * @param userId - The user whose following count to retrieve
 * @returns The number of users this user follows
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const db = await getDB();

  const following = await db.getAllFromIndex(
    'follows',
    'by-followerId',
    userId,
  );

  return following.length;
}
