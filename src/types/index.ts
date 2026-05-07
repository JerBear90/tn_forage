/**
 * ForageWise — Core TypeScript type definitions
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
  // Phase 3.2 — Spore print color and fruiting triggers
  sporePrintColor?: string;
  fruitingTriggers?: FruitingTrigger;
  // Phase 3.4 — Species summary for calendar view
  summary?: string;
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
  // Phase 3.2 — Medicinal and transplant info
  medicinalUses?: MedicinalInfo;
  transplantGuide?: TransplantInfo;
  isProtected?: boolean;
  isInvasive?: boolean;
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
  // Phase 3.4 — Tree close-ups and lookalikes
  similarTrees?: TreeLookalike[];
  barkCloseUpImages?: string[];
  leafCloseUpImages?: string[];
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
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  parkSize?: string;
  camping?: string;
  website?: string;
  gettingThere?: string;
  highlights?: string[];
  // Phase 3.2 — Entry fees and plants
  entryFees?: ParkEntryFee[];
  plants?: string[];
  // Phase 3.4 — Park social profiles
  socialProfiles?: ParkSocialProfiles;
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
  trailId?: string;
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
  /** JSON-encoded support ticket data (used by support page) */
  _supportTicket?: string;
  /** JSON-encoded missing image report (used by SpeciesImage) */
  _missingImage?: string;
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
  displayName?: string;
  avatarUrl?: string;
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

// ---------------------------------------------------------------------------
// Trailhead & Extended Trail (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** A named trailhead with GPS coordinates */
export interface Trailhead {
  name: string;
  coordinates: Coordinates;
}

/** Trail type classification */
export type TrailType = 'loop' | 'out-and-back' | 'point-to-point';

/** Trail surface type */
export type SurfaceType = 'paved' | 'gravel' | 'dirt' | 'rocky' | 'mixed';

/** Extended trail with additional metadata for park detail pages */
export interface TrailExtended extends Trail {
  elevationGain?: number;
  trailType?: TrailType;
  surfaceType?: SurfaceType;
  trailheads?: Trailhead[];
  topSights?: string[];
}

// ---------------------------------------------------------------------------
// Reviews (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** Target entity types that can receive reviews */
export type ReviewTargetType = 'park' | 'trail' | 'species';

/** A user-submitted review stored locally in IndexedDB */
export interface ReviewLocal {
  id: string;
  userId: string;
  authorName: string;
  targetType: ReviewTargetType;
  targetId: string;
  /** Integer rating from 1 to 5 */
  rating: number;
  /** Review text body, 10–2000 characters */
  text: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

/** Cached review aggregation for a target entity */
export interface ReviewAggregationLocal {
  /** Composite key: "{targetType}-{targetId}" */
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  /** Average rating rounded to 1 decimal place */
  averageRating: number;
  totalCount: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Follows (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** A directional follow relationship stored locally in IndexedDB */
export interface FollowLocal {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

// ---------------------------------------------------------------------------
// Activity Feed (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** Action types that appear in the activity feed */
export type FeedActionType = 'review_posted' | 'photo_shared' | 'trip_completed' | 'achievement_earned';

/** A cached activity feed item stored locally in IndexedDB */
export interface FeedItemLocal {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  actionType: FeedActionType;
  targetType: string;
  targetId: string;
  targetName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Achievements (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** A user achievement record stored locally in IndexedDB */
export interface AchievementLocal {
  id: string;
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  earnedAt: string;
  syncStatus: SyncStatus;
}

// ---------------------------------------------------------------------------
// Social Photos (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** Target entity types for social photos */
export type SocialPhotoTargetType = 'park' | 'trail' | 'species';

/** MIME types accepted for social photo uploads */
export type SocialPhotoMimeType = 'image/jpeg' | 'image/png';

/** A user-shared photo stored locally in IndexedDB */
export interface SocialPhoto {
  id: string;
  userId: string;
  targetType: SocialPhotoTargetType;
  targetId: string;
  blob: Blob;
  thumbnailBlob?: Blob;
  caption?: string;
  hasLocation: boolean;
  coordinates?: Coordinates;
  mimeType: SocialPhotoMimeType;
  createdAt: string;
  syncStatus: SyncStatus;
}

// ---------------------------------------------------------------------------
// Extended User Profile (Social Profile and Park Details)
// ---------------------------------------------------------------------------

/** Profile visibility setting */
export type ProfileVisibility = 'private' | 'public';

/** Extended user profile with social fields */
export interface UserProfileExtended extends UserProfileLocal {
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  completedTripCount?: number;
  achievementCount?: number;
  /** Defaults to 'private' */
  defaultVisibility: ProfileVisibility;
}

// ---------------------------------------------------------------------------
// Phase 3.2 Enhancements
// ---------------------------------------------------------------------------

// --- Trail Condition ---
export type TrailConditionCategory = 'clear' | 'issues' | 'bad-closed' | 'dry' | 'muddy' | 'snowy';

export interface TrailConditionReport {
  id: string;
  userId: string;
  trailId: string;
  categories: TrailConditionCategory[];
  details?: string;
  photoId?: string;
  reportedAt: string;
  syncStatus: SyncStatus;
}

// --- Challenge Badge ---
export interface ChallengeBadge {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
  isEarned: boolean;
}

// --- Feature Flags ---
export type FeatureAccessTier = 'free' | 'member' | 'admin';

export interface FeatureFlag {
  featureKey: string;
  accessTier: FeatureAccessTier;
  label: string;
  description?: string;
}

// --- Park Entry Fees ---
export type FeeType = 'per-vehicle' | 'per-person' | 'annual-pass' | 'free';

export interface ParkEntryFee {
  type: FeeType;
  amount?: number;
  currency: string;
  notes?: string;
}

// --- Medicinal Info ---
export interface MedicinalInfo {
  uses: string[];
  partsUsed: string[];
  preparation: string[];
  disclaimer: string;
}

export interface TransplantInfo {
  methods: string[];
  bestSeason: string;
  soilRequirements: string;
  disclaimer: string;
}

// --- Fruiting Triggers ---
export interface FruitingTrigger {
  minRainfallInches: number;
  rainfallWindowDays: number;
  minTempF: number;
  minHumidity: number;
  minSoilTempF?: number;
}

// --- Blog ---
export interface ArticleSource {
  name: string;
  author?: string;
  publication?: string;
  url?: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  author: string;
  publishedAt: string;
  summary: string;
  body: string;
  coverImage?: string;
  tags: string[];
  sources: ArticleSource[];
  lastUpdated: string;
  readTimeMinutes?: number;
}

// --- Custom Routes ---
export interface RouteWaypoint {
  id: string;
  order: number;
  type: 'park' | 'trail' | 'custom';
  referenceId?: string;
  label: string;
  coordinates: Coordinates;
  notes?: string;
}

export interface CustomRoute {
  id: string;
  userId: string;
  name: string;
  date?: string;
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  estimatedDriveMinutes: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

// --- Events ---
export type EventType = 'festival' | 'workshop' | 'outing' | 'other';

export interface EventEntry {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  coordinates?: Coordinates;
  description: string;
  type: EventType;
  sourceUrl: string;
  registrationUrl?: string;
  lastUpdated: string;
}

// --- Weather ---
export interface WeatherSnapshot {
  temperatureF: number;
  humidity: number;
  recentRainfallInches: number;
  conditions: string;
  soilTempEstimateF?: number;
  fetchedAt: string;
}

// --- Foraging Journal ---
export type JournalVisibility = 'private' | 'public';

export interface JournalEntry {
  id: string;
  userId: string;
  speciesId?: string;
  speciesGuess?: string;
  coordinates: Coordinates;
  date: string;
  time: string;
  weather: WeatherSnapshot;
  photos: string[];
  notes: string;
  visibility: JournalVisibility;
  syncStatus: SyncStatus;
  createdAt: string;
}

// --- Fruiting Forecast ---
export type FruitingLikelihood = 'high' | 'medium' | 'low';

export interface FruitingPrediction {
  speciesId: string;
  commonName: string;
  image?: string;
  likelihood: FruitingLikelihood;
  triggers: string[];
  lastUpdated: string;
}

// --- Spore Print Scanner ---
export interface SporePrintMatch {
  speciesId: string;
  commonName: string;
  expectedColor: string;
  extractedColor: string;
  colorDistance: number;
  confidencePercent: number;
}

// --- Harvest Log ---
export type SustainabilityLevel = 'green' | 'yellow' | 'red';

export interface HarvestEntry {
  id: string;
  userId: string;
  speciesId?: string;
  speciesGuess?: string;
  quantity: string;
  coordinates: Coordinates;
  locationHash: string;
  date: string;
  season: string;
  notes?: string;
  syncStatus: SyncStatus;
}

// --- Microhabitat Mapping ---
export type SlopeAspect = 'north' | 'south' | 'east' | 'west';
export type SubstrateType = 'soil' | 'dead-wood' | 'moss' | 'leaf-litter' | 'rock';
export type MicrohabitatSyncPreference = 'local-only' | 'sync';

export interface MicrohabitatVisit {
  date: string;
  weather?: WeatherSnapshot;
  speciesFound: boolean;
  notes?: string;
}

export interface MicrohabitatPinRecord {
  id: string;
  userId: string;
  coordinates: Coordinates;
  slopeAspect?: SlopeAspect;
  nearWater: boolean;
  dominantTrees: string[];
  substrate: SubstrateType;
  notes: string;
  photos: string[];
  associatedSpeciesId?: string;
  visits: MicrohabitatVisit[];
  syncPreference: MicrohabitatSyncPreference;
  syncStatus: SyncStatus;
  createdAt: string;
}

// --- Location Sharing ---
export interface SharingRecipient {
  id: string;
  name: string;
  identifier: string;
}

export interface SharingSession {
  id: string;
  userId: string;
  durationMinutes: number;
  recipients: SharingRecipient[];
  shareLink: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
  syncStatus: SyncStatus;
}

// --- Beacon / Safety ---
export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface BeaconSession {
  id: string;
  userId: string;
  durationMinutes: number;
  contacts: string[];
  lastActivityAt: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
  alertTriggered: boolean;
  lastKnownCoordinates?: Coordinates;
  syncStatus: SyncStatus;
}

// --- Check-In ---
export interface CheckInTodo {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface CheckInRecord {
  id: string;
  userId: string;
  parkId: string;
  checkedInAt: string;
  rating?: number;
  todos: CheckInTodo[];
  notes?: string;
  syncStatus: SyncStatus;
}

// --- Guided Tours ---
export interface TourWaypoint {
  id: string;
  order: number;
  coordinates: Coordinates;
  title: string;
  description: string;
  speciesRefs: string[];
  plantRefs: string[];
  ecologicalContext: string;
}

export interface GuidedTour {
  id: string;
  trailId: string;
  title: string;
  safetyReminder: string;
  waypoints: TourWaypoint[];
  lastUpdated: string;
}

// --- Buddy Matching ---
export type ExperienceLevel = 'beginner' | 'intermediate' | 'experienced';
export type ForagingInterest = 'mushrooms' | 'plants' | 'trees' | 'medicinal';
export type OutingStatus = 'pending' | 'accepted' | 'declined';

export interface ForagingProfile {
  id: string;
  userId: string;
  experienceLevel: ExperienceLevel;
  interests: ForagingInterest[];
  preferredParks: string[];
  preferredRegions: TnRegion[];
  availability: ('weekdays' | 'weekends')[];
  optedIn: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface OutingInvitation {
  id: string;
  fromUserId: string;
  toUserId: string;
  date: string;
  parkId?: string;
  description: string;
  status: OutingStatus;
  createdAt: string;
  syncStatus: SyncStatus;
}

// --- Usage Analytics ---
export interface UsageEvent {
  id: string;
  featureKey: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

// --- Offline Maps ---
export interface DownloadedMapRegion {
  id: string;
  name: string;
  bounds: { north: number; south: number; east: number; west: number };
  zoomLevels: { min: number; max: number };
  tileCount: number;
  sizeBytes: number;
  downloadedAt: string;
  parkIds: string[];
  trailIds: string[];
}

export interface MapTile {
  url: string;
  regionId: string;
  blob: Blob;
  cachedAt: string;
}

// --- Seasonal Countdown ---
export interface CountdownEntry {
  speciesId: string;
  commonName: string;
  image?: string;
  estimatedStartDate: string;
  daysRemaining: number;
  isInSeason: boolean;
  adjustmentNote?: string;
}

// --- Voice ID ---
export interface VoiceIdResult {
  transcript: string;
  extractedFeatures: Partial<IdentificationWizardAnswers>;
  matches: Array<{ speciesId: string; commonName: string; score: number }>;
}

// --- Onboarding ---
export interface OnboardingScreen {
  icon: string;
  headline: string;
  description: string;
}

// --- Push Notifications ---
export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

// --- Feedback ---
export type FeedbackType = 'bug' | 'suggestion' | 'other';

export interface FeedbackSubmission {
  id: string;
  userId?: string;
  type: FeedbackType;
  description: string;
  screenshotBlob?: Blob;
  deviceInfo: {
    browser: string;
    os: string;
    screenSize: string;
    appVersion: string;
  };
  createdAt: string;
  syncStatus: SyncStatus;
}

// ---------------------------------------------------------------------------
// Phase 3.4 Enhancements
// ---------------------------------------------------------------------------

// --- Tree Lookalike ---
export interface TreeLookalike {
  treeId: string;
  commonName: string;
  thumbnailImage?: string;
  differentiatingFeatures: string;
}

// --- Park Social Profiles ---
export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'youtube' | 'tiktok';

export interface ParkSocialProfiles {
  facebook?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  tiktok?: string;
}

// --- Homepage Layout ---
export type HomepageSectionKey =
  | 'seasonal-highlights'
  | 'community-feed'
  | 'challenges'
  | 'comparison'
  | 'routes'
  | 'mushroom-spots'
  | 'fruiting-forecast'
  | 'mushroom-calendar'
  | 'blog-preview';

export interface HomepageLayoutConfig {
  /** Ordered list of visible section keys */
  sections: HomepageSectionKey[];
  /** Last modified timestamp */
  updatedAt: string;
}

// --- Community Sub-Sections ---
export type CommunitySubSection = 'feed' | 'id-this' | 'challenges' | 'blog';

// --- Breadcrumb Referrer ---
export interface BreadcrumbReferrer {
  href: string;
  title: string;
  category: string;
}
