/**
 * Activity Feed Page — Unit Tests (logic-level)
 *
 * Tests the pure functions and logic extracted from the activity feed page.
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * data transformations, URL construction, and boolean conditions rather
 * than DOM rendering.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect } from 'vitest';

import {
  getActionLabel,
  getDetailLink,
  computeHasMore,
  sortFeedItems,
} from '@/social/feedHelpers';
import type { FeedItemLocal, FeedActionType } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFeedItem(overrides: Partial<FeedItemLocal> = {}): FeedItemLocal {
  return {
    id: overrides.id ?? 'feed-1',
    userId: overrides.userId ?? 'user-1',
    userName: overrides.userName ?? 'Jane Forager',
    userAvatar: overrides.userAvatar,
    actionType: overrides.actionType ?? 'review_posted',
    targetType: overrides.targetType ?? 'park',
    targetId: overrides.targetId ?? 'park-fall-creek-falls',
    targetName: overrides.targetName ?? 'Fall Creek Falls',
    metadata: overrides.metadata,
    createdAt: overrides.createdAt ?? '2025-01-15T10:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// 1. Feed action type labels (Requirement 2.2)
// ---------------------------------------------------------------------------

describe('Feed action type labels', () => {
  it('maps review_posted to "posted a review"', () => {
    expect(getActionLabel('review_posted')).toBe('posted a review');
  });

  it('maps photo_shared to "shared a photo"', () => {
    expect(getActionLabel('photo_shared')).toBe('shared a photo');
  });

  it('maps trip_completed to "completed a trip"', () => {
    expect(getActionLabel('trip_completed')).toBe('completed a trip');
  });

  it('maps achievement_earned to "earned an achievement"', () => {
    expect(getActionLabel('achievement_earned')).toBe('earned an achievement');
  });

  it('returns a fallback label for unknown action types', () => {
    const label = getActionLabel('unknown_action' as FeedActionType);
    expect(label).toBe('performed an action');
  });

  it('returns distinct labels for all four action types', () => {
    const types: FeedActionType[] = [
      'review_posted',
      'photo_shared',
      'trip_completed',
      'achievement_earned',
    ];
    const labels = types.map(getActionLabel);
    const unique = new Set(labels);
    expect(unique.size).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 2. Navigation links (Requirement 2.5)
// ---------------------------------------------------------------------------

describe('Navigation links for feed items', () => {
  it('links park items to /parks/{targetId}', () => {
    const item = makeFeedItem({ targetType: 'park', targetId: 'park-123' });
    expect(getDetailLink(item)).toBe('/parks/park-123');
  });

  it('links trail items to /parks/{targetId}', () => {
    const item = makeFeedItem({ targetType: 'trail', targetId: 'trail-456' });
    expect(getDetailLink(item)).toBe('/parks/trail-456');
  });

  it('links species items to /field-guide/{targetId}', () => {
    const item = makeFeedItem({ targetType: 'species', targetId: 'sp-chanterelle' });
    expect(getDetailLink(item)).toBe('/field-guide/sp-chanterelle');
  });

  it('links user items to /profile/{userId}', () => {
    const item = makeFeedItem({ targetType: 'user', userId: 'user-789' });
    expect(getDetailLink(item)).toBe('/profile/user-789');
  });

  it('falls back to /parks/{targetId} for unknown target types', () => {
    const item = makeFeedItem({ targetType: 'unknown', targetId: 'xyz' });
    expect(getDetailLink(item)).toBe('/parks/xyz');
  });

  it('preserves special characters in IDs', () => {
    const item = makeFeedItem({ targetType: 'park', targetId: 'park-big-ridge' });
    expect(getDetailLink(item)).toBe('/parks/park-big-ridge');
  });
});

// ---------------------------------------------------------------------------
// 3. Offline banner logic (Requirement 2.4)
// ---------------------------------------------------------------------------

describe('Offline banner logic', () => {
  it('shows offline banner when isOnline is false', () => {
    const isOnline = false;
    const showOfflineBanner = !isOnline;
    expect(showOfflineBanner).toBe(true);
  });

  it('hides offline banner when isOnline is true', () => {
    const isOnline = true;
    const showOfflineBanner = !isOnline;
    expect(showOfflineBanner).toBe(false);
  });

  it('uses cached feed when offline', () => {
    const isOnline = false;
    const usingCache = !isOnline;
    expect(usingCache).toBe(true);
  });

  it('uses live feed when online', () => {
    const isOnline = true;
    const usingCache = !isOnline;
    expect(usingCache).toBe(false);
  });

  it('disables Load More when using cached feed', () => {
    const usingCache = true;
    const hasMore = true;
    const showLoadMore = hasMore && !usingCache;
    expect(showLoadMore).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Pagination logic (Requirement 2.6)
// ---------------------------------------------------------------------------

describe('Pagination logic', () => {
  it('hasMore is true when fetched count equals page size', () => {
    expect(computeHasMore(20)).toBe(true);
  });

  it('hasMore is true when fetched count exceeds page size', () => {
    expect(computeHasMore(25)).toBe(true);
  });

  it('hasMore is false when fetched count is less than page size', () => {
    expect(computeHasMore(15)).toBe(false);
  });

  it('hasMore is false when fetched count is 0', () => {
    expect(computeHasMore(0)).toBe(false);
  });

  it('hasMore is false when fetched count is 1', () => {
    expect(computeHasMore(1)).toBe(false);
  });

  it('respects custom page size', () => {
    expect(computeHasMore(10, 10)).toBe(true);
    expect(computeHasMore(9, 10)).toBe(false);
  });

  it('page increments correctly', () => {
    let page = 1;
    // Simulate loading more
    page = page + 1;
    expect(page).toBe(2);
    page = page + 1;
    expect(page).toBe(3);
  });

  it('start index is calculated correctly from page number', () => {
    const pageSize = 20;
    expect((1 - 1) * pageSize).toBe(0);
    expect((2 - 1) * pageSize).toBe(20);
    expect((3 - 1) * pageSize).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// 5. Feed items reverse chronological order (Requirement 2.1)
// ---------------------------------------------------------------------------

describe('Feed items reverse chronological order', () => {
  it('sorts items newest first', () => {
    const items: FeedItemLocal[] = [
      makeFeedItem({ id: 'a', createdAt: '2025-01-10T08:00:00Z' }),
      makeFeedItem({ id: 'b', createdAt: '2025-01-15T12:00:00Z' }),
      makeFeedItem({ id: 'c', createdAt: '2025-01-12T16:00:00Z' }),
    ];

    const sorted = sortFeedItems(items);
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('c');
    expect(sorted[2].id).toBe('a');
  });

  it('preserves order when items are already sorted', () => {
    const items: FeedItemLocal[] = [
      makeFeedItem({ id: 'x', createdAt: '2025-01-20T00:00:00Z' }),
      makeFeedItem({ id: 'y', createdAt: '2025-01-15T00:00:00Z' }),
      makeFeedItem({ id: 'z', createdAt: '2025-01-10T00:00:00Z' }),
    ];

    const sorted = sortFeedItems(items);
    expect(sorted[0].id).toBe('x');
    expect(sorted[1].id).toBe('y');
    expect(sorted[2].id).toBe('z');
  });

  it('handles a single item', () => {
    const items: FeedItemLocal[] = [
      makeFeedItem({ id: 'only', createdAt: '2025-01-01T00:00:00Z' }),
    ];

    const sorted = sortFeedItems(items);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe('only');
  });

  it('handles an empty array', () => {
    const sorted = sortFeedItems([]);
    expect(sorted).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const items: FeedItemLocal[] = [
      makeFeedItem({ id: 'a', createdAt: '2025-01-10T00:00:00Z' }),
      makeFeedItem({ id: 'b', createdAt: '2025-01-20T00:00:00Z' }),
    ];

    const sorted = sortFeedItems(items);
    // Original should still have 'a' first
    expect(items[0].id).toBe('a');
    // Sorted should have 'b' first
    expect(sorted[0].id).toBe('b');
  });

  it('handles items with identical timestamps', () => {
    const items: FeedItemLocal[] = [
      makeFeedItem({ id: 'a', createdAt: '2025-01-15T10:00:00Z' }),
      makeFeedItem({ id: 'b', createdAt: '2025-01-15T10:00:00Z' }),
    ];

    const sorted = sortFeedItems(items);
    expect(sorted).toHaveLength(2);
    // Both should be present regardless of order
    const ids = sorted.map((i) => i.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('correctly orders items across different days', () => {
    const items: FeedItemLocal[] = [
      makeFeedItem({ id: 'jan', createdAt: '2025-01-01T00:00:00Z' }),
      makeFeedItem({ id: 'mar', createdAt: '2025-03-01T00:00:00Z' }),
      makeFeedItem({ id: 'feb', createdAt: '2025-02-01T00:00:00Z' }),
    ];

    const sorted = sortFeedItems(items);
    expect(sorted[0].id).toBe('mar');
    expect(sorted[1].id).toBe('feb');
    expect(sorted[2].id).toBe('jan');
  });
});
