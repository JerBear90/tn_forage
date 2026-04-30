/**
 * ForageFlow — IndexedDB Database Wrapper
 *
 * Offline-first data layer using the `idb` library.
 * This module defines the typed database schema, opens the database,
 * and exports helper functions for common CRUD operations.
 *
 * All stores are defined in version 1. Future schema changes should
 * increment the version and add upgrade logic in the `upgrade` callback.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Species,
  Plant,
  Tree,
  Park,
  Trail,
  Route,
  Trip,
  ExpeditionLog,
  Photo,
  UserProfileLocal,
  MembershipLocal,
  AuthMetaLocal,
  SyncQueueItem,
  Settings,
  CachedMapRegion,
  CommunityDraft,
  CommunityFlag,
  Challenge,
} from '@/types';

// ---------------------------------------------------------------------------
// Database Schema
// ---------------------------------------------------------------------------

export const DB_NAME = 'forageflow';
export const DB_VERSION = 2;

export interface ForageFlowDB extends DBSchema {
  species: {
    key: string;
    value: Species;
    indexes: {
      'by-category': string;
      'by-commonName': string;
      'by-scientificName': string;
      'by-edibilityLabel': string;
      'by-lastUpdated': string;
    };
  };
  plants: {
    key: string;
    value: Plant;
    indexes: {
      'by-commonName': string;
      'by-scientificName': string;
      'by-edibilityLabel': string;
      'by-lastUpdated': string;
    };
  };
  trees: {
    key: string;
    value: Tree;
    indexes: {
      'by-commonName': string;
      'by-scientificName': string;
      'by-lastUpdated': string;
    };
  };
  parks: {
    key: string;
    value: Park;
    indexes: {
      'by-name': string;
      'by-region': string;
      'by-lastUpdated': string;
    };
  };
  trails: {
    key: string;
    value: Trail;
    indexes: {
      'by-parkId': string;
      'by-name': string;
      'by-difficulty': string;
      'by-lastUpdated': string;
    };
  };
  routes: {
    key: string;
    value: Route;
    indexes: {
      'by-parkId': string;
      'by-name': string;
      'by-difficulty': string;
      'by-lastUpdated': string;
    };
  };
  trips: {
    key: string;
    value: Trip;
    indexes: {
      'by-userId': string;
      'by-date': string;
      'by-syncStatus': string;
    };
  };
  expeditionLogs: {
    key: string;
    value: ExpeditionLog;
    indexes: {
      'by-userId': string;
      'by-tripId': string;
      'by-syncStatus': string;
    };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: {
      'by-expeditionLogId': string;
      'by-syncStatus': string;
      'by-createdAt': string;
    };
  };
  userProfileLocal: {
    key: string;
    value: UserProfileLocal;
  };
  membershipLocal: {
    key: string;
    value: MembershipLocal;
    indexes: {
      'by-userId': string;
    };
  };
  authMetaLocal: {
    key: string;
    value: AuthMetaLocal;
    indexes: {
      'by-userId': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-userId': string;
      'by-collection': string;
      'by-syncStatus': string;
      'by-createdAt': string;
    };
  };
  settings: {
    key: string;
    value: Settings;
  };
  cachedMapRegions: {
    key: string;
    value: CachedMapRegion;
    indexes: {
      'by-cachedAt': string;
    };
  };
  communityDrafts: {
    key: string;
    value: CommunityDraft;
    indexes: {
      'by-userId': string;
      'by-createdAt': string;
      'by-updatedAt': string;
    };
  };
  communityFlags: {
    key: string;
    value: CommunityFlag;
    indexes: {
      'by-targetId': string;
      'by-userId': string;
      'by-createdAt': string;
    };
  };
  challenges: {
    key: string;
    value: Challenge;
    indexes: {
      'by-category': string;
      'by-completedAt': string;
    };
  };
}

// ---------------------------------------------------------------------------
// Store Names (useful for iteration / validation)
// ---------------------------------------------------------------------------

export const STORE_NAMES: (keyof ForageFlowDB)[] = [
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

// ---------------------------------------------------------------------------
// Database Initialization
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<ForageFlowDB>> | null = null;

/**
 * Open (or return the cached handle to) the ForageFlow IndexedDB database.
 *
 * The database is created lazily on first call. Subsequent calls return the
 * same promise so only one connection is held open at a time.
 */
export function getDB(): Promise<IDBPDatabase<ForageFlowDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ForageFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // ---- Version 1: Create all original stores ----
        if (oldVersion < 1) {
          // ---- Species ----
          const speciesStore = db.createObjectStore('species', { keyPath: 'id' });
          speciesStore.createIndex('by-category', 'category');
          speciesStore.createIndex('by-commonName', 'commonName');
          speciesStore.createIndex('by-scientificName', 'scientificName');
          speciesStore.createIndex('by-edibilityLabel', 'edibilityLabel');
          speciesStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Plants ----
          const plantsStore = db.createObjectStore('plants', { keyPath: 'id' });
          plantsStore.createIndex('by-commonName', 'commonName');
          plantsStore.createIndex('by-scientificName', 'scientificName');
          plantsStore.createIndex('by-edibilityLabel', 'edibilityLabel');
          plantsStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Trees ----
          const treesStore = db.createObjectStore('trees', { keyPath: 'id' });
          treesStore.createIndex('by-commonName', 'commonName');
          treesStore.createIndex('by-scientificName', 'scientificName');
          treesStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Parks ----
          const parksStore = db.createObjectStore('parks', { keyPath: 'id' });
          parksStore.createIndex('by-name', 'name');
          parksStore.createIndex('by-region', 'region');
          parksStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Trails ----
          const trailsStore = db.createObjectStore('trails', { keyPath: 'id' });
          trailsStore.createIndex('by-parkId', 'parkId');
          trailsStore.createIndex('by-name', 'name');
          trailsStore.createIndex('by-difficulty', 'difficulty');
          trailsStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Routes ----
          const routesStore = db.createObjectStore('routes', { keyPath: 'id' });
          routesStore.createIndex('by-parkId', 'parkId');
          routesStore.createIndex('by-name', 'name');
          routesStore.createIndex('by-difficulty', 'difficulty');
          routesStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Trips ----
          const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
          tripsStore.createIndex('by-userId', 'userId');
          tripsStore.createIndex('by-date', 'date');
          tripsStore.createIndex('by-syncStatus', 'syncStatus');

          // ---- Expedition Logs ----
          const logsStore = db.createObjectStore('expeditionLogs', { keyPath: 'id' });
          logsStore.createIndex('by-userId', 'userId');
          logsStore.createIndex('by-tripId', 'tripId');
          logsStore.createIndex('by-syncStatus', 'syncStatus');

          // ---- Photos ----
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
          photosStore.createIndex('by-expeditionLogId', 'expeditionLogId');
          photosStore.createIndex('by-syncStatus', 'syncStatus');
          photosStore.createIndex('by-createdAt', 'createdAt');

          // ---- User Profile (local cache) ----
          db.createObjectStore('userProfileLocal', { keyPath: 'id' });

          // ---- Membership (local cache) ----
          const membershipStore = db.createObjectStore('membershipLocal', { keyPath: 'id' });
          membershipStore.createIndex('by-userId', 'userId');

          // ---- Auth Meta (local cache) ----
          const authStore = db.createObjectStore('authMetaLocal', { keyPath: 'id' });
          authStore.createIndex('by-userId', 'userId');

          // ---- Sync Queue ----
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'localId' });
          syncStore.createIndex('by-userId', 'userId');
          syncStore.createIndex('by-collection', 'collection');
          syncStore.createIndex('by-syncStatus', 'syncStatus');
          syncStore.createIndex('by-createdAt', 'createdAt');

          // ---- Settings ----
          db.createObjectStore('settings', { keyPath: 'id' });

          // ---- Cached Map Regions ----
          const mapStore = db.createObjectStore('cachedMapRegions', { keyPath: 'id' });
          mapStore.createIndex('by-cachedAt', 'cachedAt');

          // ---- Community Drafts ----
          const draftsStore = db.createObjectStore('communityDrafts', { keyPath: 'id' });
          draftsStore.createIndex('by-userId', 'userId');
          draftsStore.createIndex('by-createdAt', 'createdAt');
          draftsStore.createIndex('by-updatedAt', 'updatedAt');

          // ---- Community Flags ----
          const flagsStore = db.createObjectStore('communityFlags', { keyPath: 'id' });
          flagsStore.createIndex('by-targetId', 'targetId');
          flagsStore.createIndex('by-userId', 'userId');
          flagsStore.createIndex('by-createdAt', 'createdAt');
        }

        // ---- Version 2: Add challenges store ----
        if (oldVersion < 2) {
          const challengesStore = db.createObjectStore('challenges', { keyPath: 'id' });
          challengesStore.createIndex('by-category', 'category');
          challengesStore.createIndex('by-completedAt', 'completedAt');
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Store name type (explicit union for idb compatibility)
// ---------------------------------------------------------------------------

type StoreName = 'species' | 'plants' | 'trees' | 'parks' | 'trails'
  | 'routes' | 'trips' | 'expeditionLogs' | 'photos' | 'userProfileLocal'
  | 'membershipLocal' | 'authMetaLocal' | 'syncQueue' | 'settings'
  | 'cachedMapRegions' | 'communityDrafts' | 'communityFlags' | 'challenges';

// ---------------------------------------------------------------------------
// Generic CRUD Helpers
// ---------------------------------------------------------------------------

/**
 * Get a single record by key from any store.
 */
export async function getRecord<S extends StoreName>(
  storeName: S,
  key: ForageFlowDB[S]['key'],
): Promise<ForageFlowDB[S]['value'] | undefined> {
  const db = await getDB();
  return db.get(storeName, key);
}

/**
 * Get all records from a store.
 */
export async function getAllRecords<S extends StoreName>(
  storeName: S,
): Promise<ForageFlowDB[S]['value'][]> {
  const db = await getDB();
  return db.getAll(storeName);
}

/**
 * Put (insert or update) a record into a store.
 */
export async function putRecord<S extends StoreName>(
  storeName: S,
  value: ForageFlowDB[S]['value'],
): Promise<ForageFlowDB[S]['key']> {
  const db = await getDB();
  return db.put(storeName, value);
}

/**
 * Delete a record by key from a store.
 */
export async function deleteRecord<S extends StoreName>(
  storeName: S,
  key: ForageFlowDB[S]['key'],
): Promise<void> {
  const db = await getDB();
  return db.delete(storeName, key);
}

/**
 * Clear all records from a store.
 */
export async function clearStore<S extends StoreName>(
  storeName: S,
): Promise<void> {
  const db = await getDB();
  return db.clear(storeName);
}

/**
 * Count the number of records in a store.
 */
export async function countRecords<S extends StoreName>(
  storeName: S,
): Promise<number> {
  const db = await getDB();
  return db.count(storeName);
}
