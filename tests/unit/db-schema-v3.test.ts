/**
 * IndexedDB Schema v4 Upgrade — Unit Tests
 *
 * Verifies that the version 4 database schema creates all stores from
 * versions 1–4 with the correct indexes.
 *
 * **Validates: Requirements 14.1**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll } from 'vitest';
import { getDB, DB_NAME, DB_VERSION, STORE_NAMES } from '@/offline/db';
import type { IDBPDatabase } from 'idb';
import type { ForageFlowDB } from '@/offline/db';

// ---------------------------------------------------------------------------
// Shared database handle — opened once for all tests
// ---------------------------------------------------------------------------

let db: IDBPDatabase<ForageFlowDB>;

beforeAll(async () => {
  db = await getDB();
});

// ---------------------------------------------------------------------------
// Version constant
// ---------------------------------------------------------------------------

describe('DB version', () => {
  it('DB_VERSION is 4', () => {
    expect(DB_VERSION).toBe(4);
  });

  it('opened database reports version 4', () => {
    expect(db.version).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// New v3 stores and their indexes
// ---------------------------------------------------------------------------

describe('Version 3 new stores', () => {
  it('creates the "follows" store with correct indexes', () => {
    expect(db.objectStoreNames.contains('follows')).toBe(true);
    const tx = db.transaction('follows', 'readonly');
    const store = tx.objectStore('follows');
    const indexNames = Array.from(store.indexNames);
    expect(indexNames).toContain('by-followerId');
    expect(indexNames).toContain('by-followedId');
    expect(indexNames).toHaveLength(2);
  });

  it('creates the "reviews" store with correct indexes', () => {
    expect(db.objectStoreNames.contains('reviews')).toBe(true);
    const tx = db.transaction('reviews', 'readonly');
    const store = tx.objectStore('reviews');
    const indexNames = Array.from(store.indexNames);
    expect(indexNames).toContain('by-targetType-targetId');
    expect(indexNames).toContain('by-userId');
    expect(indexNames).toContain('by-createdAt');
    expect(indexNames).toContain('by-syncStatus');
    expect(indexNames).toHaveLength(4);
  });

  it('creates the "socialPhotos" store with correct indexes', () => {
    expect(db.objectStoreNames.contains('socialPhotos')).toBe(true);
    const tx = db.transaction('socialPhotos', 'readonly');
    const store = tx.objectStore('socialPhotos');
    const indexNames = Array.from(store.indexNames);
    expect(indexNames).toContain('by-targetType-targetId');
    expect(indexNames).toContain('by-userId');
    expect(indexNames).toContain('by-createdAt');
    expect(indexNames).toContain('by-syncStatus');
    expect(indexNames).toHaveLength(4);
  });

  it('creates the "achievements" store with correct indexes', () => {
    expect(db.objectStoreNames.contains('achievements')).toBe(true);
    const tx = db.transaction('achievements', 'readonly');
    const store = tx.objectStore('achievements');
    const indexNames = Array.from(store.indexNames);
    expect(indexNames).toContain('by-userId');
    expect(indexNames).toContain('by-earnedAt');
    expect(indexNames).toHaveLength(2);
  });

  it('creates the "feedItems" store with correct indexes', () => {
    expect(db.objectStoreNames.contains('feedItems')).toBe(true);
    const tx = db.transaction('feedItems', 'readonly');
    const store = tx.objectStore('feedItems');
    const indexNames = Array.from(store.indexNames);
    expect(indexNames).toContain('by-userId');
    expect(indexNames).toContain('by-createdAt');
    expect(indexNames).toHaveLength(2);
  });

  it('creates the "reviewAggregations" store with no indexes', () => {
    expect(db.objectStoreNames.contains('reviewAggregations')).toBe(true);
    const tx = db.transaction('reviewAggregations', 'readonly');
    const store = tx.objectStore('reviewAggregations');
    const indexNames = Array.from(store.indexNames);
    expect(indexNames).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Original stores preserved
// ---------------------------------------------------------------------------

describe('Original stores preserved', () => {
  const originalStores = [
    'species',
    'plants',
    'trees',
    'parks',
    'trails',
    'routes',
    'trips',
    'expeditionLogs',
    'photos',
    'userProfileLocal',
    'membershipLocal',
    'authMetaLocal',
    'syncQueue',
    'settings',
    'cachedMapRegions',
    'communityDrafts',
    'communityFlags',
    'challenges',
  ] as const;

  it.each(originalStores)('store "%s" still exists', (storeName) => {
    expect(db.objectStoreNames.contains(storeName)).toBe(true);
  });

  it('all 18 original stores are present', () => {
    for (const name of originalStores) {
      expect(db.objectStoreNames.contains(name)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// STORE_NAMES completeness
// ---------------------------------------------------------------------------

describe('STORE_NAMES array', () => {
  it('contains all 44 stores', () => {
    expect(STORE_NAMES).toHaveLength(44);
  });

  it('includes all 6 v3 stores', () => {
    const newStores = [
      'follows',
      'reviews',
      'socialPhotos',
      'achievements',
      'feedItems',
      'reviewAggregations',
    ];
    for (const name of newStores) {
      expect(STORE_NAMES).toContain(name);
    }
  });

  it('includes all 20 v4 stores', () => {
    const v4Stores = [
      'blogArticles',
      'customRoutes',
      'eventEntries',
      'trailConditionReports',
      'checkIns',
      'guidedTours',
      'journalEntries',
      'harvestEntries',
      'microhabitatPins',
      'foragingProfiles',
      'outingInvitations',
      'usageEvents',
      'beaconSessions',
      'locationSharingSessions',
      'downloadedMapRegions',
      'mapTiles',
      'fruitingForecasts',
      'emergencyContacts',
      'featureFlags',
      'pushSubscriptions',
    ];
    for (const name of v4Stores) {
      expect(STORE_NAMES).toContain(name);
    }
  });

  it('includes all 18 original stores', () => {
    const originalStores = [
      'species',
      'plants',
      'trees',
      'parks',
      'trails',
      'routes',
      'trips',
      'expeditionLogs',
      'photos',
      'userProfileLocal',
      'membershipLocal',
      'authMetaLocal',
      'syncQueue',
      'settings',
      'cachedMapRegions',
      'communityDrafts',
      'communityFlags',
      'challenges',
    ];
    for (const name of originalStores) {
      expect(STORE_NAMES).toContain(name);
    }
  });

  it('matches the actual objectStoreNames on the database', () => {
    const dbStoreNames = Array.from(db.objectStoreNames).sort();
    const sortedStoreNames = [...STORE_NAMES].sort();
    expect(sortedStoreNames).toEqual(dbStoreNames);
  });
});
