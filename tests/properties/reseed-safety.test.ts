// Feature: phase3-enhancements, Property 12: Re-seed preserves user data
/**
 * Re-seed Preserves User Data — Property-Based Test
 *
 * For any state of the IndexedDB database where user-generated stores
 * (trips, expeditionLogs, photos, syncQueue, communityDrafts, communityFlags)
 * contain records, calling seedDatabase with an incremented SEED_DATA_VERSION
 * shall not modify, clear, or delete any records in those user-generated stores.
 *
 * **Validates: Requirements 17.3**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import { getDB, putRecord, getAllRecords } from '@/offline/db';
import { seedDatabase } from '@/data/seedDatabase';
import type {
  Trip,
  ExpeditionLog,
  Photo,
  SyncQueueItem,
  CommunityDraft,
  CommunityFlag,
  SyncStatus,
  LocationType,
  LogVisibility,
  FlagReason,
  SyncOperation,
  SyncQueueStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Arbitraries — generate random user data records
// ---------------------------------------------------------------------------

const arbSyncStatus: fc.Arbitrary<SyncStatus> = fc.constantFrom(
  'pending',
  'synced',
  'failed',
  'conflict',
);

const arbLocationType: fc.Arbitrary<LocationType> = fc.constantFrom(
  'park',
  'trail',
  'route',
  'custom',
);

const arbVisibility: fc.Arbitrary<LogVisibility> = fc.constantFrom(
  'private',
  'public',
);

const arbFlagReason: fc.Arbitrary<FlagReason> = fc.constantFrom(
  'unsafe-content',
  'incorrect-id',
  'spam',
  'other',
);

const arbSyncOperation: fc.Arbitrary<SyncOperation> = fc.constantFrom(
  'create',
  'update',
  'delete',
);

const arbSyncQueueStatus: fc.Arbitrary<SyncQueueStatus> = fc.constantFrom(
  'pending',
  'in-progress',
  'failed',
  'done',
);

const arbISODate: fc.Arbitrary<string> = fc
  .integer({
    min: new Date('2020-01-01T00:00:00Z').getTime(),
    max: new Date('2099-12-31T23:59:59Z').getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

const arbTrip: fc.Arbitrary<Trip> = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  locationType: arbLocationType,
  locationId: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  customLocation: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  date: arbISODate,
  notes: fc.string({ maxLength: 100 }),
  targetSpecies: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  companions: fc.string({ maxLength: 50 }),
  safetyNotes: fc.string({ maxLength: 100 }),
  syncStatus: arbSyncStatus,
});

const arbExpeditionLog: fc.Arbitrary<ExpeditionLog> = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  tripId: fc.uuid(),
  photos: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }),
  coordinates: fc.option(
    fc.record({ lat: fc.double({ min: -90, max: 90, noNaN: true }), lng: fc.double({ min: -180, max: 180, noNaN: true }) }),
    { nil: undefined },
  ),
  speciesGuess: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  notes: fc.string({ maxLength: 100 }),
  habitat: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  treeNearby: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  visibility: arbVisibility,
  syncStatus: arbSyncStatus,
  createdAt: arbISODate,
});

const arbCommunityDraft: fc.Arbitrary<CommunityDraft> = fc.record({
  id: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  speciesGuess: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  photos: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 3 }),
  coordinates: fc.option(
    fc.record({ lat: fc.double({ min: -90, max: 90, noNaN: true }), lng: fc.double({ min: -180, max: 180, noNaN: true }) }),
    { nil: undefined },
  ),
  notes: fc.string({ maxLength: 100 }),
  visibility: arbVisibility,
  createdAt: arbISODate,
  updatedAt: arbISODate,
});

const arbCommunityFlag: fc.Arbitrary<CommunityFlag> = fc.record({
  id: fc.uuid(),
  targetId: fc.uuid(),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  reason: arbFlagReason,
  details: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  createdAt: arbISODate,
});

const arbSyncQueueItem: fc.Arbitrary<SyncQueueItem> = fc.record({
  localId: fc.uuid(),
  serverId: fc.option(fc.uuid(), { nil: undefined }),
  userId: fc.string({ minLength: 1, maxLength: 20 }),
  collection: fc.string({ minLength: 1, maxLength: 20 }),
  operation: arbSyncOperation,
  payload: fc.constant({}),
  payloadHash: fc.string({ minLength: 8, maxLength: 16 }),
  createdAt: arbISODate,
  updatedAt: arbISODate,
  syncStatus: arbSyncQueueStatus,
  retryCount: fc.nat({ max: 10 }),
  clientVersion: fc.nat({ max: 100 }),
});

// ---------------------------------------------------------------------------
// Composite arbitrary: a set of user data across all user stores
// ---------------------------------------------------------------------------

interface UserDataSet {
  trips: Trip[];
  expeditionLogs: ExpeditionLog[];
  communityDrafts: CommunityDraft[];
  communityFlags: CommunityFlag[];
  syncQueue: SyncQueueItem[];
}

const arbUserDataSet: fc.Arbitrary<UserDataSet> = fc.record({
  trips: fc.array(arbTrip, { minLength: 1, maxLength: 5 }),
  expeditionLogs: fc.array(arbExpeditionLog, { minLength: 1, maxLength: 5 }),
  communityDrafts: fc.array(arbCommunityDraft, { minLength: 1, maxLength: 5 }),
  communityFlags: fc.array(arbCommunityFlag, { minLength: 1, maxLength: 5 }),
  syncQueue: fc.array(arbSyncQueueItem, { minLength: 1, maxLength: 5 }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clear all user stores between test runs */
async function clearUserStores() {
  const db = await getDB();
  await db.clear('trips');
  await db.clear('expeditionLogs');
  await db.clear('communityDrafts');
  await db.clear('communityFlags');
  await db.clear('syncQueue');
  await db.clear('settings');
}

/** Insert user data into IndexedDB */
async function insertUserData(data: UserDataSet) {
  for (const trip of data.trips) {
    await putRecord('trips', trip);
  }
  for (const log of data.expeditionLogs) {
    await putRecord('expeditionLogs', log);
  }
  for (const draft of data.communityDrafts) {
    await putRecord('communityDrafts', draft);
  }
  for (const flag of data.communityFlags) {
    await putRecord('communityFlags', flag);
  }
  for (const item of data.syncQueue) {
    await putRecord('syncQueue', item);
  }
}

/**
 * Force the seed data version to a low value so the next seedDatabase()
 * call triggers a re-seed of reference stores.
 */
async function forceLowSeedVersion() {
  await putRecord('settings', { id: 'seedDataVersion', value: 0 } as never);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearUserStores();
});

describe('Feature: phase3-enhancements, Property 12: Re-seed preserves user data', () => {
  it('re-seeding reference stores does not modify any user-generated store records', { timeout: 60_000 }, async () => {
    await fc.assert(
      fc.asyncProperty(arbUserDataSet, async (userData) => {
        // 1. Run initial seed to populate reference stores
        await seedDatabase();

        // 2. Insert random user data into user stores
        await insertUserData(userData);

        // 3. Snapshot user data before re-seed
        const tripsBefore = await getAllRecords('trips');
        const logsBefore = await getAllRecords('expeditionLogs');
        const draftsBefore = await getAllRecords('communityDrafts');
        const flagsBefore = await getAllRecords('communityFlags');
        const syncQueueBefore = await getAllRecords('syncQueue');

        // 4. Force a low seed version to trigger re-seed
        await forceLowSeedVersion();

        // 5. Run seedDatabase again — this should re-seed reference stores
        //    but leave user stores untouched
        const result = await seedDatabase();

        // Verify re-seed actually happened (reference stores were populated)
        expect(result.speciesSeeded).toBeGreaterThan(0);
        expect(result.plantsSeeded).toBeGreaterThan(0);
        expect(result.treesSeeded).toBeGreaterThan(0);

        // 6. Read user data after re-seed
        const tripsAfter = await getAllRecords('trips');
        const logsAfter = await getAllRecords('expeditionLogs');
        const draftsAfter = await getAllRecords('communityDrafts');
        const flagsAfter = await getAllRecords('communityFlags');
        const syncQueueAfter = await getAllRecords('syncQueue');

        // 7. Verify user data is unchanged — same count
        expect(tripsAfter).toHaveLength(tripsBefore.length);
        expect(logsAfter).toHaveLength(logsBefore.length);
        expect(draftsAfter).toHaveLength(draftsBefore.length);
        expect(flagsAfter).toHaveLength(flagsBefore.length);
        expect(syncQueueAfter).toHaveLength(syncQueueBefore.length);

        // 8. Verify each record is identical by comparing IDs and content
        for (const tripBefore of tripsBefore) {
          const match = tripsAfter.find((t) => t.id === tripBefore.id);
          expect(match).toBeDefined();
          expect(match).toEqual(tripBefore);
        }

        for (const logBefore of logsBefore) {
          const match = logsAfter.find((l) => l.id === logBefore.id);
          expect(match).toBeDefined();
          expect(match).toEqual(logBefore);
        }

        for (const draftBefore of draftsBefore) {
          const match = draftsAfter.find((d) => d.id === draftBefore.id);
          expect(match).toBeDefined();
          expect(match).toEqual(draftBefore);
        }

        for (const flagBefore of flagsBefore) {
          const match = flagsAfter.find((f) => f.id === flagBefore.id);
          expect(match).toBeDefined();
          expect(match).toEqual(flagBefore);
        }

        for (const itemBefore of syncQueueBefore) {
          const match = syncQueueAfter.find((s) => s.localId === itemBefore.localId);
          expect(match).toBeDefined();
          expect(match).toEqual(itemBefore);
        }

        // Clean up for next iteration
        await clearUserStores();
      }),
      { numRuns: 10 },
    );
  });
});
