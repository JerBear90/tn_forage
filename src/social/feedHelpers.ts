/**
 * ForageFlow — Activity Feed Helpers
 *
 * Pure functions for the activity feed page. Extracted so they can be
 * unit-tested without importing JSX/React components.
 *
 * Requirements: 2.1, 2.2, 2.5, 2.6
 */

import type { FeedItemLocal, FeedActionType } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FEED_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Action type labels (Requirement 2.2)
// ---------------------------------------------------------------------------

/**
 * Map a FeedActionType to a human-readable label.
 */
export function getActionLabel(actionType: FeedActionType): string {
  switch (actionType) {
    case 'review_posted':
      return 'posted a review';
    case 'photo_shared':
      return 'shared a photo';
    case 'trip_completed':
      return 'completed a trip';
    case 'achievement_earned':
      return 'earned an achievement';
    default:
      return 'performed an action';
  }
}

// ---------------------------------------------------------------------------
// Navigation links (Requirement 2.5)
// ---------------------------------------------------------------------------

/**
 * Build the navigation link for a feed item based on its targetType.
 *
 * - park    → /parks/{targetId}
 * - trail   → /parks/{targetId}  (trails live under parks)
 * - species → /field-guide/{targetId}
 * - user    → /profile/{userId}
 *
 * Falls back to /parks/{targetId} for unknown target types.
 */
export function getDetailLink(
  item: Pick<FeedItemLocal, 'targetType' | 'targetId' | 'userId'>,
): string {
  switch (item.targetType) {
    case 'park':
    case 'trail':
      return `/parks/${item.targetId}`;
    case 'species':
      return `/field-guide/${item.targetId}`;
    case 'user':
      return `/profile/${item.userId}`;
    default:
      return `/parks/${item.targetId}`;
  }
}

// ---------------------------------------------------------------------------
// Pagination (Requirement 2.6)
// ---------------------------------------------------------------------------

/**
 * Determine whether the "Load More" button should be shown.
 * True when the last fetched page returned a full page of results.
 */
export function computeHasMore(
  fetchedCount: number,
  pageSize: number = FEED_PAGE_SIZE,
): boolean {
  return fetchedCount >= pageSize;
}

// ---------------------------------------------------------------------------
// Sorting (Requirement 2.1)
// ---------------------------------------------------------------------------

/**
 * Sort feed items in reverse chronological order (newest first).
 * Returns a new array — does not mutate the input.
 */
export function sortFeedItems(items: FeedItemLocal[]): FeedItemLocal[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
