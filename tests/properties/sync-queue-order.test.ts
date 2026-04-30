/**
 * Sync Queue FIFO Ordering — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 17: Sync queue FIFO ordering
 *
 * For any sequence of sync queue items with distinct createdAt timestamps,
 * the sync queue shall process items in ascending order by createdAt
 * (oldest first).
 *
 * **Validates: Requirements 14.4**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { putRecord, getDB, clearStore } from '@/offline/db';
import type { SyncQueueItem } from '@/types';

// Feature: social-profile-and-park-details, Property 17: Sync queue FIFO ordering

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid SyncQueueItem with the given localId and createdAt. */
function makeSyncItem(localId: string, createdAt: string): SyncQueueItem {
  return {
    localId,
    userId: 'user-1',
    collection: 'reviews',
    operation: 'create',
    payload: {},
    payloadHash: localId,
    createdAt,
    updatedAt: createdAt,
    syncStatus: 'pending',
    retryCount: 0,
    clientVersion: 1,
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generate an array of distinct ISO timestamps.
 * We use a base epoch and add random offsets to guarantee uniqueness.
 */
const arbDistinctTimestamps = fc
  .uniqueArray(fc.integer({ min: 0, max: 1_000_000_000 }), { minLength: 1, maxLength: 30 })
  .map((offsets) =>
    offsets.map((offset) => new Date(1_700_000_000_000 + offset * 1000).toISOString()),
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStore('syncQueue');
});

describe('Feature: social-profile-and-park-details, Property 17: Sync queue FIFO ordering', () => {
  it('items retrieved via by-createdAt index are in ascending order (FIFO)', async () => {
    await fc.assert(
      fc.asyncProperty(arbDistinctTimestamps, async (timestamps) => {
        await clearStore('syncQueue');

        // Shuffle timestamps so insertion order differs from sorted order
        const shuffled = [...timestamps].sort(() => Math.random() - 0.5);

        // Insert items in shuffled order
        for (let i = 0; i < shuffled.length; i++) {
          await putRecord('syncQueue', makeSyncItem(`item-${i}`, shuffled[i]));
        }

        // Retrieve items using the by-createdAt index (ascending by default)
        const db = await getDB();
        const items = await db.getAllFromIndex('syncQueue', 'by-createdAt');

        // Verify ascending order by createdAt
        for (let i = 1; i < items.length; i++) {
          expect(items[i].createdAt >= items[i - 1].createdAt).toBe(true);
        }

        // Verify the sorted result matches a manual sort of the original timestamps
        const expectedOrder = [...timestamps].sort();
        const actualOrder = items.map((item) => item.createdAt);
        expect(actualOrder).toEqual(expectedOrder);
      }),
      { numRuns: 100 },
    );
  });
});
