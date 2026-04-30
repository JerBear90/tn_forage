/**
 * ForageFlow — Core TypeScript type definitions
 *
 * These types define the shape of data stored in IndexedDB and used
 * throughout the application. They map 1-to-1 with the IndexedDB stores
 * defined in src/offline/db.ts.
 */

// ---------------------------------------------------------------------------
// Guided ID Wizard
// ---------------------------------------------------------------------------

/** Underside type options for mushroom identification */
export type UndersideType = 'Gills' | 'Pores' | 'Teeth' | 'Smooth' | 'Unknown';

/** Growth location options */
export type GrowthLocation = 'Soil' | 'Dead wood' | 'Living tree' | 'Leaf litter' | 'Moss' | 'Unknown';

/** Nearby tree options */
export type NearbyTree = 'Oak' | 'Hickory' | 'Elm' | 'Maple' | 'Pine' | 'Poplar' | 'Unknown';

/** Cap color options */
export type CapColor = 'White' | 'Brown' | 'Yellow' | 'Orange' | 'Red' | 'Gray' | 'Other';

/** Cap shape options */
export type CapShape = 'Convex' | 'Flat' | 'Funnel' | 'Conical' | 'Bell' | 'Irregular' | 'Unknown';

/** Stem feature options (multi-select) */
export type StemFeature = 'Thick' | 'Thin' | 'Ring present' | 'Volva present' | 'Hollow' | 'Solid' | 'Unknown';

/** Bruising/cut reaction options */
export type BruisingReaction = 'None' | 'Blue' | 'Brown' | 'Yellow' | 'Red' | 'Black' | 'Unknown';

/** Season options */
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

/** Moisture options */
export type Moisture = 'Dry' | 'Moist' | 'Wet' | 'Unknown';

/** Complete wizard answers for guided identification */
export interface IdentificationWizardAnswers {
  undersideType: UndersideType | null;
  growthLocation: GrowthLocation | null;
  nearbyTree: NearbyTree | null;
  capColor: CapColor | null;
  capColorCustom: string;
  capShape: CapShape | null;
  stemFeatures: StemFeature[];
  bruisingReaction: BruisingReaction | null;
  season: Season | null;
  moisture: Moisture | null;
  gpsCoordinates: { lat: number; lng: number } | null;
}

/** Default empty wizard answers */
export const DEFAULT_WIZARD_ANSWERS: IdentificationWizardAnswers = {
  undersideType: null,
  growthLocation: null,
  nearbyTree: null,
  capColor: null,
  capColorCustom: '',
  capShape: null,
  stemFeatures: [],
  bruisingReaction: null,
  season: null,
  moisture: null,
  gpsCoordinates: null,
};

// ---------------------------------------------------------------------------
// Shared / Utility Types
// ---------------------------------------------------------------------------

/** GPS coordinate pair */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Sync status for offline-first entities */
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

/** Edibility labels — safety-first language only */
export type EdibilityLabel =
  | 'commonly-considered-edible-with-expert-confirmation'
  | 'toxic'
  | 'inedible'
  | 'unknown';

/** Species category */
export type SpeciesCategory = 'mushroom' | 'plant' | 'tree';

/** Trail difficulty */
export type TrailDifficulty = 'easy' | 'moderate' | 'hard' | 'expert';

/** Expedition log visibility */
export type LogVisibility = 'private' | 'public';

/** Tennessee geographic region */
export type TnRegion = 'East TN' | 'Middle TN' | 'West TN';

/** Challenge category */
export type ChallengeCategory = 'foraging' | 'seasonal' | 'park-exploration';

/** A single criterion within a challenge */
export interface ChallengeCriterion {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
}

/** A challenge definition with user progress */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  criteria: ChallengeCriterion[];
  completedAt?: string;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Species
// ---------------------------------------------------------------------------

export interface Lookalike {
  speciesId: string;
  commonName: string;
  isToxic: boolean;
  differentiatingFeatures: string;
}

export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  category: SpeciesCategory;
  images: string[];
  habitat: string;
  treeAssociations: string[];
  season: string[];
  region: string;
  regions?: string[];
  identificationSteps: string[];
  lookalikes: Lookalike[];
  toxicLookalikes: Lookalike[];
  sporePrint?: string;
  bruisingNotes?: string;
  edibilityLabel: EdibilityLabel;
  safetyNotes: string;
  sources: string[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Plants (non-mushroom plant entries)
// ---------------------------------------------------------------------------

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  category: 'plant';
  images: string[];
  habitat: string;
  treeAssociations: string[];
  season: string[];
  region: string;
  regions?: string[];
  identificationSteps: string[];
  lookalikes: Lookalike[];
  toxicLookalikes: Lookalike[];
  edibilityLabel: EdibilityLabel;
  safetyNotes: string;
  sources: string[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------

export interface Tree {
  id: string;
  commonName: string;
  scientificName: string;
  images: string[];
  habitat: string;
  barkDescription: string;
  leafDescription: string;
  shapeDescription: string;
  associatedSpecies: string[];
  region: string;
  sourceUrl?: string;
  regions?: TnRegion[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Parks
// ---------------------------------------------------------------------------

export interface Park {
  id: string;
  name: string;
  region: string;
  coordinates: Coordinates;
  image?: string;
  amenities: string[];
  trails: string[];
  hours?: string;
  fees?: string;
  foragingRules: string;
  sourceUrl?: string;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Trails
// ---------------------------------------------------------------------------

export interface Trail {
  id: string;
  parkId: string;
  name: string;
  distance: number;
  difficulty: TrailDifficulty;
  coordinates: Coordinates[];
  elevationProfile?: number[];
  likelyTrees: string[];
  likelySpecies: string[];
  images: string[];
  sourceUrl?: string;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export interface Route {
  id: string;
  parkId: string;
  name: string;
  distance: number;
  difficulty: TrailDifficulty;
  coordinates: Coordinates[];
  elevationProfile?: number[];
  likelyTrees: string[];
  likelySpecies: string[];
  images: string[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export type LocationType = 'park' | 'trail' | 'route' | 'custom';

export interface Trip {
  id: string;
  userId: string;
  locationType: LocationType;
  locationId?: string;
  customLocation?: string;
  date: string;
  notes: string;
  targetSpecies: string[];
  companions: string;
  safetyNotes: string;
  syncStatus: SyncStatus;
}

// ---------------------------------------------------------------------------
// Expedition Logs
// ---------------------------------------------------------------------------

export interface ExpeditionLog {
  id: string;
  userId: string;
  tripId: string;
  photos: string[];
  coordinates?: Coordinates;
  speciesGuess?: string;
  notes: string;
  habitat?: string;
  treeNearby?: string;
  visibility: LogVisibility;
  syncStatus: SyncStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Photos (binary blobs stored locally)
// ---------------------------------------------------------------------------

export interface Photo {
  id: string;
  expeditionLogId?: string;
  blob: Blob;
  mimeType: string;
  caption?: string;
  coordinates?: Coordinates;
  createdAt: string;
  syncStatus: SyncStatus;
}

// ---------------------------------------------------------------------------
// User Profile (local cache)
// ---------------------------------------------------------------------------

export type UserRole = 'guest' | 'free' | 'member' | 'super_user';

export type MembershipPlan =
  | 'free'
  | 'monthly'
  | 'yearly'
  | 'lifetime'
  | 'admin';

export type MembershipStatus =
  | 'inactive'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled';

export interface UserProfileLocal {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Membership (local cache — server-authoritative via Stripe)
// ---------------------------------------------------------------------------

export interface MembershipLocal {
  id: string;
  userId: string;
  membershipPlan: MembershipPlan;
  membershipStatus: MembershipStatus;
  currentPeriodEnd?: string;
  membershipLastVerifiedAt: string;
}

// ---------------------------------------------------------------------------
// Auth Meta (local session cache)
// ---------------------------------------------------------------------------

export type AuthState =
  | 'unknown'
  | 'guest'
  | 'authenticated-online'
  | 'authenticated-offline'
  | 'session-expired'
  | 'syncing'
  | 'error';

export interface AuthMetaLocal {
  id: string;
  userId: string;
  authState: AuthState;
  offlineAccessAllowed: boolean;
  lastAuthenticatedAt: string;
  provider?: string;
}

// ---------------------------------------------------------------------------
// Sync Queue
// ---------------------------------------------------------------------------

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncQueueStatus = 'pending' | 'in-progress' | 'failed' | 'done';

export interface SyncQueueItem {
  localId: string;
  serverId?: string;
  userId: string;
  collection: string;
  operation: SyncOperation;
  payload: unknown;
  payloadHash: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncQueueStatus;
  retryCount: number;
  clientVersion: number;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  id: string;
  theme: ThemePreference;
  safetyDisclaimerDismissed: boolean;
  introAnimationShown: boolean;
  lastSyncAt?: string;
}

// ---------------------------------------------------------------------------
// Cached Map Regions
// ---------------------------------------------------------------------------

export interface CachedMapRegion {
  id: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevel: number;
  tileUrls: string[];
  cachedAt: string;
}

// ---------------------------------------------------------------------------
// Community Drafts
// ---------------------------------------------------------------------------

export interface CommunityDraft {
  id: string;
  userId: string;
  speciesGuess?: string;
  photos: string[];
  coordinates?: Coordinates;
  notes: string;
  visibility: LogVisibility;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Community Flags (content reporting)
// ---------------------------------------------------------------------------

/** Reasons a user can flag community content. */
export type FlagReason = 'unsafe-content' | 'incorrect-id' | 'spam' | 'other';

export interface CommunityFlag {
  id: string;
  /** The ID of the sighting/draft being flagged. */
  targetId: string;
  /** The user who submitted the flag. */
  userId: string;
  reason: FlagReason;
  details?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Community Comments (structural placeholder — needs backend)
// ---------------------------------------------------------------------------

export interface CommunityComment {
  id: string;
  /** The sighting this comment belongs to. */
  sightingId: string;
  userId: string;
  text: string;
  /** If this comment includes a suggested species ID. */
  suggestedSpeciesId?: string;
  createdAt: string;
}
