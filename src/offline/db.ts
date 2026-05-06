/**
 * ForageWise — IndexedDB Database Wrapper
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
  FollowLocal,
  ReviewLocal,
  SocialPhoto,
  AchievementLocal,
  FeedItemLocal,
  ReviewAggregationLocal,
  BlogArticle,
  CustomRoute,
  EventEntry,
  TrailConditionReport,
  CheckInRecord,
  GuidedTour,
  JournalEntry,
  HarvestEntry,
  MicrohabitatPinRecord,
  ForagingProfile,
  OutingInvitation,
  UsageEvent,
  BeaconSession,
  SharingSession,
  DownloadedMapRegion,
  MapTile,
  FruitingPrediction,
  EmergencyContact,
  FeatureFlag,
  PushSubscriptionRecord,
} from '@/types';

// ---------------------------------------------------------------------------
// Database Schema
// ---------------------------------------------------------------------------

export const DB_NAME = 'foragewise';
export const DB_VERSION = 4;

export interface ForageWiseDB extends DBSchema {
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
  follows: {
    key: string;
    value: FollowLocal;
    indexes: {
      'by-followerId': string;
      'by-followedId': string;
    };
  };
  reviews: {
    key: string;
    value: ReviewLocal;
    indexes: {
      'by-targetType-targetId': [string, string];
      'by-userId': string;
      'by-createdAt': string;
      'by-syncStatus': string;
    };
  };
  socialPhotos: {
    key: string;
    value: SocialPhoto;
    indexes: {
      'by-targetType-targetId': [string, string];
      'by-userId': string;
      'by-createdAt': string;
      'by-syncStatus': string;
    };
  };
  achievements: {
    key: string;
    value: AchievementLocal;
    indexes: {
      'by-userId': string;
      'by-earnedAt': string;
    };
  };
  feedItems: {
    key: string;
    value: FeedItemLocal;
    indexes: {
      'by-userId': string;
      'by-createdAt': string;
    };
  };
  reviewAggregations: {
    key: string;
    value: ReviewAggregationLocal;
  };
  blogArticles: {
    key: string;
    value: BlogArticle;
    indexes: {
      'by-publishedAt': string;
      'by-tag': string;
    };
  };
  customRoutes: {
    key: string;
    value: CustomRoute;
    indexes: {
      'by-userId': string;
      'by-createdAt': string;
    };
  };
  eventEntries: {
    key: string;
    value: EventEntry;
    indexes: {
      'by-date': string;
      'by-type': string;
    };
  };
  trailConditionReports: {
    key: string;
    value: TrailConditionReport;
    indexes: {
      'by-trailId': string;
      'by-reportedAt': string;
      'by-userId': string;
    };
  };
  checkIns: {
    key: string;
    value: CheckInRecord;
    indexes: {
      'by-userId': string;
      'by-parkId': string;
      'by-checkedInAt': string;
    };
  };
  guidedTours: {
    key: string;
    value: GuidedTour;
    indexes: {
      'by-trailId': string;
    };
  };
  journalEntries: {
    key: string;
    value: JournalEntry;
    indexes: {
      'by-userId': string;
      'by-date': string;
      'by-speciesId': string;
    };
  };
  harvestEntries: {
    key: string;
    value: HarvestEntry;
    indexes: {
      'by-userId': string;
      'by-locationHash': string;
      'by-date': string;
    };
  };
  microhabitatPins: {
    key: string;
    value: MicrohabitatPinRecord;
    indexes: {
      'by-userId': string;
      'by-associatedSpeciesId': string;
    };
  };
  foragingProfiles: {
    key: string;
    value: ForagingProfile;
    indexes: {
      'by-userId': string;
    };
  };
  outingInvitations: {
    key: string;
    value: OutingInvitation;
    indexes: {
      'by-fromUserId': string;
      'by-toUserId': string;
      'by-status': string;
    };
  };
  usageEvents: {
    key: string;
    value: UsageEvent;
    indexes: {
      'by-featureKey': string;
      'by-timestamp': string;
    };
  };
  beaconSessions: {
    key: string;
    value: BeaconSession;
    indexes: {
      'by-userId': string;
      'by-isActive': string;
    };
  };
  locationSharingSessions: {
    key: string;
    value: SharingSession;
    indexes: {
      'by-userId': string;
      'by-isActive': string;
    };
  };
  downloadedMapRegions: {
    key: string;
    value: DownloadedMapRegion;
    indexes: {
      'by-downloadedAt': string;
    };
  };
  mapTiles: {
    key: string;
    value: MapTile;
    indexes: {
      'by-regionId': string;
    };
  };
  fruitingForecasts: {
    key: string;
    value: FruitingPrediction;
    indexes: {
      'by-speciesId': string;
      'by-lastUpdated': string;
    };
  };
  emergencyContacts: {
    key: string;
    value: EmergencyContact;
    indexes: {
      'by-userId': string;
    };
  };
  featureFlags: {
    key: string;
    value: FeatureFlag;
  };
  pushSubscriptions: {
    key: string;
    value: PushSubscriptionRecord;
    indexes: {
      'by-userId': string;
    };
  };
}

// ---------------------------------------------------------------------------
// Store Names (useful for iteration / validation)
// ---------------------------------------------------------------------------

export const STORE_NAMES: (keyof ForageWiseDB)[] = [
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
  'follows',
  'reviews',
  'socialPhotos',
  'achievements',
  'feedItems',
  'reviewAggregations',
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

// ---------------------------------------------------------------------------
// Database Initialization
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<ForageWiseDB>> | null = null;

/**
 * Open (or return the cached handle to) the ForageWise IndexedDB database.
 *
 * The database is created lazily on first call. Subsequent calls return the
 * same promise so only one connection is held open at a time.
 */
export function getDB(): Promise<IDBPDatabase<ForageWiseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ForageWiseDB>(DB_NAME, DB_VERSION, {
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

        // ---- Version 3: Add social and park detail stores ----
        if (oldVersion < 3) {
          // ---- Follows ----
          const followsStore = db.createObjectStore('follows', { keyPath: 'id' });
          followsStore.createIndex('by-followerId', 'followerId');
          followsStore.createIndex('by-followedId', 'followedId');

          // ---- Reviews ----
          const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id' });
          reviewsStore.createIndex('by-targetType-targetId', ['targetType', 'targetId']);
          reviewsStore.createIndex('by-userId', 'userId');
          reviewsStore.createIndex('by-createdAt', 'createdAt');
          reviewsStore.createIndex('by-syncStatus', 'syncStatus');

          // ---- Social Photos ----
          const socialPhotosStore = db.createObjectStore('socialPhotos', { keyPath: 'id' });
          socialPhotosStore.createIndex('by-targetType-targetId', ['targetType', 'targetId']);
          socialPhotosStore.createIndex('by-userId', 'userId');
          socialPhotosStore.createIndex('by-createdAt', 'createdAt');
          socialPhotosStore.createIndex('by-syncStatus', 'syncStatus');

          // ---- Achievements ----
          const achievementsStore = db.createObjectStore('achievements', { keyPath: 'id' });
          achievementsStore.createIndex('by-userId', 'userId');
          achievementsStore.createIndex('by-earnedAt', 'earnedAt');

          // ---- Feed Items ----
          const feedItemsStore = db.createObjectStore('feedItems', { keyPath: 'id' });
          feedItemsStore.createIndex('by-userId', 'userId');
          feedItemsStore.createIndex('by-createdAt', 'createdAt');

          // ---- Review Aggregations ----
          db.createObjectStore('reviewAggregations', { keyPath: 'id' });
        }

        // ---- Version 4: Add Phase 3.2 enhancement stores ----
        if (oldVersion < 4) {
          // ---- Blog Articles ----
          const blogStore = db.createObjectStore('blogArticles', { keyPath: 'id' });
          blogStore.createIndex('by-publishedAt', 'publishedAt');
          blogStore.createIndex('by-tag', 'tags', { multiEntry: true });

          // ---- Custom Routes ----
          const customRoutesStore = db.createObjectStore('customRoutes', { keyPath: 'id' });
          customRoutesStore.createIndex('by-userId', 'userId');
          customRoutesStore.createIndex('by-createdAt', 'createdAt');

          // ---- Event Entries ----
          const eventStore = db.createObjectStore('eventEntries', { keyPath: 'id' });
          eventStore.createIndex('by-date', 'date');
          eventStore.createIndex('by-type', 'type');

          // ---- Trail Condition Reports ----
          const conditionStore = db.createObjectStore('trailConditionReports', { keyPath: 'id' });
          conditionStore.createIndex('by-trailId', 'trailId');
          conditionStore.createIndex('by-reportedAt', 'reportedAt');
          conditionStore.createIndex('by-userId', 'userId');

          // ---- Check-Ins ----
          const checkInStore = db.createObjectStore('checkIns', { keyPath: 'id' });
          checkInStore.createIndex('by-userId', 'userId');
          checkInStore.createIndex('by-parkId', 'parkId');
          checkInStore.createIndex('by-checkedInAt', 'checkedInAt');

          // ---- Guided Tours ----
          const tourStore = db.createObjectStore('guidedTours', { keyPath: 'id' });
          tourStore.createIndex('by-trailId', 'trailId');

          // ---- Journal Entries ----
          const journalStore = db.createObjectStore('journalEntries', { keyPath: 'id' });
          journalStore.createIndex('by-userId', 'userId');
          journalStore.createIndex('by-date', 'date');
          journalStore.createIndex('by-speciesId', 'speciesId');

          // ---- Harvest Entries ----
          const harvestStore = db.createObjectStore('harvestEntries', { keyPath: 'id' });
          harvestStore.createIndex('by-userId', 'userId');
          harvestStore.createIndex('by-locationHash', 'locationHash');
          harvestStore.createIndex('by-date', 'date');

          // ---- Microhabitat Pins ----
          const microhabitatStore = db.createObjectStore('microhabitatPins', { keyPath: 'id' });
          microhabitatStore.createIndex('by-userId', 'userId');
          microhabitatStore.createIndex('by-associatedSpeciesId', 'associatedSpeciesId');

          // ---- Foraging Profiles ----
          const profileStore = db.createObjectStore('foragingProfiles', { keyPath: 'id' });
          profileStore.createIndex('by-userId', 'userId');

          // ---- Outing Invitations ----
          const invitationStore = db.createObjectStore('outingInvitations', { keyPath: 'id' });
          invitationStore.createIndex('by-fromUserId', 'fromUserId');
          invitationStore.createIndex('by-toUserId', 'toUserId');
          invitationStore.createIndex('by-status', 'status');

          // ---- Usage Events ----
          const usageStore = db.createObjectStore('usageEvents', { keyPath: 'id' });
          usageStore.createIndex('by-featureKey', 'featureKey');
          usageStore.createIndex('by-timestamp', 'timestamp');

          // ---- Beacon Sessions ----
          const beaconStore = db.createObjectStore('beaconSessions', { keyPath: 'id' });
          beaconStore.createIndex('by-userId', 'userId');
          beaconStore.createIndex('by-isActive', 'isActive');

          // ---- Location Sharing Sessions ----
          const sharingStore = db.createObjectStore('locationSharingSessions', { keyPath: 'id' });
          sharingStore.createIndex('by-userId', 'userId');
          sharingStore.createIndex('by-isActive', 'isActive');

          // ---- Downloaded Map Regions ----
          const downloadedRegionStore = db.createObjectStore('downloadedMapRegions', { keyPath: 'id' });
          downloadedRegionStore.createIndex('by-downloadedAt', 'downloadedAt');

          // ---- Map Tiles ----
          const mapTileStore = db.createObjectStore('mapTiles', { keyPath: 'url' });
          mapTileStore.createIndex('by-regionId', 'regionId');

          // ---- Fruiting Forecasts ----
          const forecastStore = db.createObjectStore('fruitingForecasts', { keyPath: 'id' });
          forecastStore.createIndex('by-speciesId', 'speciesId');
          forecastStore.createIndex('by-lastUpdated', 'lastUpdated');

          // ---- Emergency Contacts ----
          const emergencyStore = db.createObjectStore('emergencyContacts', { keyPath: 'id' });
          emergencyStore.createIndex('by-userId', 'userId');

          // ---- Feature Flags ----
          db.createObjectStore('featureFlags', { keyPath: 'featureKey' });

          // ---- Push Subscriptions ----
          const pushStore = db.createObjectStore('pushSubscriptions', { keyPath: 'id' });
          pushStore.createIndex('by-userId', 'userId');
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Store name type (explicit union for idb compatibility)
// ---------------------------------------------------------------------------

export type StoreName = 'species' | 'plants' | 'trees' | 'parks' | 'trails'
  | 'routes' | 'trips' | 'expeditionLogs' | 'photos' | 'userProfileLocal'
  | 'membershipLocal' | 'authMetaLocal' | 'syncQueue' | 'settings'
  | 'cachedMapRegions' | 'communityDrafts' | 'communityFlags' | 'challenges'
  | 'follows' | 'reviews' | 'socialPhotos' | 'achievements' | 'feedItems'
  | 'reviewAggregations' | 'blogArticles' | 'customRoutes' | 'eventEntries'
  | 'trailConditionReports' | 'checkIns' | 'guidedTours' | 'journalEntries'
  | 'harvestEntries' | 'microhabitatPins' | 'foragingProfiles' | 'outingInvitations'
  | 'usageEvents' | 'beaconSessions' | 'locationSharingSessions'
  | 'downloadedMapRegions' | 'mapTiles' | 'fruitingForecasts' | 'emergencyContacts'
  | 'featureFlags' | 'pushSubscriptions';

// ---------------------------------------------------------------------------
// Generic CRUD Helpers
// ---------------------------------------------------------------------------

/**
 * Get a single record by key from any store.
 */
export async function getRecord<S extends StoreName>(
  storeName: S,
  key: ForageWiseDB[S]['key'],
): Promise<ForageWiseDB[S]['value'] | undefined> {
  const db = await getDB();
  return db.get(storeName, key);
}

/**
 * Get all records from a store.
 */
export async function getAllRecords<S extends StoreName>(
  storeName: S,
): Promise<ForageWiseDB[S]['value'][]> {
  const db = await getDB();
  return db.getAll(storeName);
}

/**
 * Put (insert or update) a record into a store.
 */
export async function putRecord<S extends StoreName>(
  storeName: S,
  value: ForageWiseDB[S]['value'],
): Promise<ForageWiseDB[S]['key']> {
  const db = await getDB();
  return db.put(storeName, value);
}

/**
 * Delete a record by key from a store.
 */
export async function deleteRecord<S extends StoreName>(
  storeName: S,
  key: ForageWiseDB[S]['key'],
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

/**
 * Get multiple records by key from a store in a single readonly transaction.
 *
 * Opens one transaction and issues all `get` requests within it, which is
 * more efficient than calling `getRecord` in a loop (each of which opens
 * its own transaction). Records whose keys are not found are filtered out
 * of the returned array.
 */
export async function batchGetRecords<S extends StoreName>(
  storeName: S,
  keys: ForageWiseDB[S]['key'][],
): Promise<ForageWiseDB[S]['value'][]> {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);

  const results = await Promise.all(keys.map((key) => store.get(key)));
  await tx.done;

  return results.filter(
    (record) => record !== undefined,
  ) as ForageWiseDB[S]['value'][];
}
