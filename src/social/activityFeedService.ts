/**
 * ForageWise — Activity Feed Service
 *
 * Provides paginated and cached activity feed from followed users.
 * All data is read from IndexedDB for offline-first access.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */

import { getDB, getAllRecords } from '@/offline/db';
import type { FeedItemLocal } from '@/types';

// ---------------------------------------------------------------------------
// Get followed user IDs
// ---------------------------------------------------------------------------

/**
 * Get the set of user IDs that the current user follows.
 *
 * @param userId - The current user's ID
 * @returns A Set of followed user IDs
 */
async function getFollowedUserIds(userId: string): Promise<Set<string>> {
  const db = await getDB();
  const follows = await db.getAllFromIndex('follows', 'by-followerId', userId);
  return new Set(follows.map((f) => f.followedId));
}

// ---------------------------------------------------------------------------
// Get paginated feed
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated activity feed for the current user.
 *
 * Returns feed items from users that the current user follows,
 * sorted by createdAt descending (most recent first), paginated
 * at the specified page size (default 20).
 *
 * @param userId   - The current user's ID
 * @param page     - 1-based page number
 * @param pageSize - Number of items per page (default 20)
 * @returns Array of FeedItemLocal records for the requested page
 */
export async function getFeed(
  userId: string,
  page: number,
  pageSize: number = 20,
): Promise<FeedItemLocal[]> {
  const followedIds = await getFollowedUserIds(userId);

  // Get all feed items from IndexedDB
  const allItems = await getAllRecords('feedItems');

  // Filter to items from followed users
  const filtered = allItems.filter((item) => followedIds.has(item.userId));

  // Sort by createdAt descending (most recent first)
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Paginate
  const start = (page - 1) * pageSize;
  return filtered.slice(start, start + pageSize);
}

// ---------------------------------------------------------------------------
// Get cached feed
// ---------------------------------------------------------------------------

/**
 * Get all cached feed items from IndexedDB for the current user.
 *
 * Returns all feed items from followed users, sorted by createdAt
 * descending. No pagination — returns the full cached set.
 *
 * @param userId - The current user's ID
 * @returns Array of all cached FeedItemLocal records
 */
export async function getCachedFeed(
  userId: string,
): Promise<FeedItemLocal[]> {
  const followedIds = await getFollowedUserIds(userId);

  // Get all feed items from IndexedDB
  const allItems = await getAllRecords('feedItems');

  // Filter to items from followed users
  const filtered = allItems.filter((item) => followedIds.has(item.userId));

  // Sort by createdAt descending (most recent first)
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return filtered;
}
