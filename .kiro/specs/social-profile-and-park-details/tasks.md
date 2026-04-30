# Implementation Plan: Social Profile and Park Details

## Overview

This plan implements two complementary feature sets for ForageFlow: (1) a social layer with follow system, activity feed, photo sharing, reviews, achievements, and public profiles; and (2) enhanced park and trail detail pages with extended metadata, trail maps, photo tours, reviews display, directions, weather links, and contact info. All features build on the existing offline-first IndexedDB + PocketBase sync queue architecture. Implementation proceeds bottom-up: types and data layer first, then services, then UI components, wiring everything together at the end.

## Tasks

- [x] 1. Extend types and IndexedDB schema for social and trail data
  - [x] 1.1 Add new TypeScript types and interfaces to `src/types/index.ts`
    - Add `TrailExtended` interface extending `Trail` with `elevationGain`, `trailType`, `surfaceType`, `trailheads`, `topSights`
    - Add `Trailhead` interface with `name` and `coordinates`
    - Add `ReviewTargetType`, `ReviewLocal`, `ReviewAggregationLocal`, `FollowLocal`, `FeedItemLocal`, `FeedActionType`, `AchievementLocal`, `SocialPhoto`, `UserProfileExtended` types
    - Ensure `SyncStatus` is reused for all new social entities
    - _Requirements: 6.1–6.7, 4.1, 1.1, 2.1, 5.1, 3.1, 13.1_

  - [x] 1.2 Upgrade IndexedDB schema to version 3 in `src/offline/db.ts`
    - Add 6 new stores: `follows`, `reviews`, `socialPhotos`, `achievements`, `feedItems`, `reviewAggregations`
    - Add indexes as defined in the design: `by-followerId`, `by-followedId`, `by-targetType-targetId`, `by-userId`, `by-createdAt`, `by-syncStatus`, `by-earnedAt`
    - Add upgrade migration from version 2 to version 3
    - Update `ForageFlowDB` schema interface, `STORE_NAMES` array, and `StoreName` type
    - _Requirements: 14.1, 14.2, 14.3, 1.5, 3.3, 4.5, 5.6_

  - [x] 1.3 Write unit tests for IndexedDB schema upgrade
    - Test that version 3 upgrade creates all 6 new stores with correct indexes
    - Test that existing stores are preserved during upgrade
    - _Requirements: 14.1_

- [x] 2. Implement utility functions for trail and park details
  - [x] 2.1 Create `src/utils/trailUtils.ts` with `estimateHikingTime` and `formatHikingTime`
    - Implement Naismith's rule: `(distanceMiles / 3) * 60 + (elevationGainFeet / 1000) * 30`
    - Implement `formatHikingTime` to produce strings like "2h 15m" or "45m"
    - Handle edge cases: zero distance, zero elevation, negative inputs (clamp to 0)
    - _Requirements: 6.3_

  - [x] 2.2 Write property test for hiking time estimation
    - **Property 12: Hiking time estimation (Naismith's rule)**
    - **Validates: Requirements 6.3**

  - [x] 2.3 Create `src/utils/directionsUtils.ts` with `buildDirectionsUrl`
    - Build Google Maps directions URL from GPS coordinates
    - Format: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
    - _Requirements: 10.1, 10.2_

  - [x] 2.4 Write property test for directions URL construction
    - **Property 15: Directions URL construction**
    - **Validates: Requirements 10.1, 10.2**

  - [x] 2.5 Create `src/utils/weatherUtils.ts` with `buildWeatherUrl`
    - Build weather.gov forecast URL from GPS coordinates
    - Format: `https://forecast.weather.gov/MapClick.php?lat={lat}&lon={lng}`
    - _Requirements: 11.1_

  - [x] 2.6 Write property test for weather URL construction
    - **Property 16: Weather URL construction**
    - **Validates: Requirements 11.1**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement review validation and aggregation logic
  - [x] 4.1 Create `src/social/reviewService.ts` with `ReviewService`
    - Implement `validateReviewText`: reject if trimmed length < 10 or > 2000 characters
    - Implement `submitReview`: enforce one review per user per target (upsert), save to IndexedDB `reviews` store, enqueue in sync queue when offline
    - Implement `getReviews`: return reviews sorted by `createdAt` descending, paginated at 10 per page
    - Implement `getAggregation`: compute average rating (1 decimal place) and total count from IndexedDB
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

  - [x] 4.2 Write property test for review text length validation
    - **Property 10: Review text length validation**
    - **Validates: Requirements 4.6, 4.7**

  - [x] 4.3 Write property test for one review per user per target (idempotence)
    - **Property 8: One review per user per target (idempotence)**
    - **Validates: Requirements 4.2**

  - [x] 4.4 Write property test for review sorting and pagination
    - **Property 9: Review sorting and pagination**
    - **Validates: Requirements 4.4**

  - [x] 4.5 Write property test for review storage round-trip
    - **Property 7: Review storage round-trip**
    - **Validates: Requirements 4.1**

  - [x] 4.6 Write property test for review aggregation computation
    - **Property 13: Review aggregation computation**
    - **Validates: Requirements 8.1**

  - [x] 4.7 Write property test for review privacy — no email or GPS exposure
    - **Property 19: Review privacy — no email or GPS exposure**
    - **Validates: Requirements 15.5**

- [x] 5. Implement follow service
  - [x] 5.1 Create `src/social/followService.ts` with `FollowService`
    - Implement `followUser`: create directional follow in IndexedDB `follows` store, prevent self-follow, enqueue in sync queue
    - Implement `unfollowUser`: remove follow from IndexedDB, enqueue delete in sync queue
    - Implement `isFollowing`: check IndexedDB `follows` store by followerId + followedId
    - Implement `getFollowerCount` and `getFollowingCount`: count from IndexedDB indexes
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 5.2 Write property test for follow/unfollow round-trip
    - **Property 1: Follow/unfollow round-trip**
    - **Validates: Requirements 1.1, 1.2**

  - [x] 5.3 Write property test for self-follow prevention
    - **Property 2: Self-follow prevention**
    - **Validates: Requirements 1.6**

- [x] 6. Implement photo service with EXIF stripping
  - [x] 6.1 Create `src/social/photoService.ts` with `PhotoService`
    - Implement `validatePhoto`: check MIME type (JPEG/PNG only) and file size (≤ 10 MB)
    - Implement `stripExif`: use Canvas API to re-encode image, stripping all EXIF metadata
    - Implement `uploadPhoto`: strip EXIF unless `keepLocation` is true, store in IndexedDB `socialPhotos`, enqueue upload in sync queue
    - Implement `getPhotos`: return seed photos first, then user photos sorted by `createdAt` descending
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 15.2_

  - [x] 6.2 Write property test for photo file validation
    - **Property 5: Photo file validation**
    - **Validates: Requirements 3.2**

  - [x] 6.3 Write property test for photo tour ordering
    - **Property 14: Photo tour ordering**
    - **Validates: Requirements 9.2**

- [x] 7. Implement achievement tracker and activity feed service
  - [x] 7.1 Create `src/social/achievementTracker.ts` with `AchievementTracker`
    - Implement `evaluateOnTripComplete`: check trip against achievement criteria, record new achievements in IndexedDB `achievements` store, enqueue sync
    - Implement `getAchievements`: return all achievements for a user from IndexedDB
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 7.2 Create `src/social/activityFeedService.ts` with `ActivityFeedService`
    - Implement `getFeed`: fetch paginated feed from PocketBase (max 20 items per page), cache in IndexedDB `feedItems`
    - Implement `getCachedFeed`: return cached feed items from IndexedDB sorted by `createdAt` descending
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 7.3 Write property test for feed reverse-chronological ordering
    - **Property 3: Feed reverse-chronological ordering**
    - **Validates: Requirements 2.1**

  - [x] 7.4 Write property test for feed pagination cap
    - **Property 4: Feed pagination cap**
    - **Validates: Requirements 2.6**

  - [x] 7.5 Write property test for visibility filtering
    - **Property 11: Visibility filtering**
    - **Validates: Requirements 5.5, 13.4, 15.4**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement PocketBase collection schemas and server-side rules
  - [x] 9.1 Create PocketBase migration for new collections
    - Create `follows` collection with `followerId`, `followedId`, `createdAt` fields and unique constraint on (followerId, followedId)
    - Create `reviews` collection with `userId`, `targetType`, `targetId`, `rating`, `text`, `createdAt`, `updatedAt` and unique constraint on (userId, targetType, targetId)
    - Create `social_photos` collection with `userId`, `targetType`, `targetId`, `file`, `caption`, `hasLocation`, `coordinates`, `createdAt`
    - Create `achievements` collection with `userId`, `achievementId`, `title`, `description`, `earnedAt`
    - Create `activity_feed` collection with `userId`, `actionType`, `targetType`, `targetId`, `metadata`, `createdAt`
    - Add server-side role validation rules: authenticated users can only create/update/delete their own records
    - Add review validation rules: rating 1–5, text 10–2000 characters
    - _Requirements: 1.3, 4.7, 15.5_

- [x] 10. Build enhanced park detail UI components
  - [x] 10.1 Create `src/components/parks/TrailDetailPanel.tsx`
    - Display trail length (miles), elevation gain (feet), estimated hiking time, difficulty badge, trail type, surface type
    - Display trailhead locations with names and "Get Directions" links
    - Use TailwindCSS with mobile-first responsive layout and large tap targets
    - Read from `TrailExtended` type; render all data from IndexedDB (offline-capable)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 10.2 Create `src/components/parks/TrailMapRenderer.tsx`
    - Render Leaflet map with trail polyline from `coordinates` array
    - Display trailhead markers at each trailhead location
    - Fit map bounds to trail extent on initial load
    - Support zoom and pan interaction
    - Fall back to cached tiles from `cachedMapRegions` store when offline
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.3 Create `src/components/parks/PhotoTour.tsx`
    - Horizontally swipeable photo gallery
    - Display seed photos first, then user-submitted photos sorted by most recent
    - Tap to open full-screen lightbox (reuse existing `ImageLightbox` component)
    - Show only locally cached photos when offline
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.4 Create `src/components/parks/ReviewsSection.tsx`
    - Display aggregate star rating (1 decimal place) and total review count
    - Display paginated review list (10 per page) with author name, star rating, date, text
    - "Write a Review" button opens review submission form
    - Review form with star rating selector and text input with validation (10–2000 chars)
    - Show cached reviews when offline with offline indicator banner
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 4.1, 4.6_

  - [x] 10.5 Write unit tests for park detail components
    - Test TrailDetailPanel renders all metadata fields correctly
    - Test ReviewsSection displays aggregate rating and review list
    - Test PhotoTour ordering (seed photos first)
    - Test conditional rendering: "Getting There" omitted when absent, contact section omitted when no data
    - _Requirements: 6.1–6.7, 8.1, 8.2, 9.2, 10.3, 10.4, 12.5_

- [x] 11. Enhance park detail page with new sections
  - [x] 11.1 Update `src/app/parks/[id]/page.tsx` to integrate new components
    - Replace existing simple trail list with `TrailDetailPanel` for each trail
    - Add `TrailMapRenderer` for each trail (expandable/collapsible)
    - Add `PhotoTour` section with seed photos and user photos
    - Add `ReviewsSection` with aggregate rating and review list
    - Add weather link section: show link when online, hide with message when offline
    - Add "Top Sights" section when trail data includes `topSights`
    - Enhance contact section with `tel:` links for phone, `target="_blank"` for website
    - Enhance "Getting There" section; omit when no data available
    - Add offline indicators for sections requiring connectivity
    - Load `TrailExtended` data from IndexedDB
    - _Requirements: 6.1–6.8, 7.1–7.5, 8.1–8.4, 9.1–9.4, 10.1–10.4, 11.1–11.2, 12.1–12.5, 14.1, 14.6_

  - [x] 11.2 Write unit tests for enhanced park detail page
    - Test weather link visible online, hidden offline with message
    - Test directions link opens Google Maps URL with correct coordinates
    - Test phone number uses `tel:` protocol
    - Test website URL opens in new tab
    - Test offline indicators appear for weather, reviews, and feed sections
    - _Requirements: 11.1, 11.2, 10.1, 12.3, 12.4, 14.6_

- [x] 12. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Build user profile page with social features
  - [x] 13.1 Create `src/components/profile/ProfileHeader.tsx`
    - Display user avatar, display name, and optional bio
    - Display follower count and following count
    - Show follow/unfollow button when viewing another user's profile
    - Hide follow button on own profile
    - _Requirements: 13.1, 13.2, 13.5, 1.1, 1.2, 1.6_

  - [x] 13.2 Create `src/components/profile/ProfileTabs.tsx`
    - Implement tabbed interface with: Completed Trips, Achievements, Reviews, Photos
    - Completed Trips tab: list trips with date, location name, species found
    - Achievements tab: list achievements with title, description, date earned
    - Reviews tab: list user's reviews with target name, rating, text
    - Photos tab: grid of user's shared photos
    - When viewing another user's profile, filter to public-visibility items only
    - _Requirements: 13.3, 13.4, 5.3, 5.4, 5.5_

  - [x] 13.3 Update `src/app/profile/page.tsx` and `ProfileContent.tsx` to integrate social profile
    - Integrate `ProfileHeader` and `ProfileTabs` components
    - Load profile data from IndexedDB for own profile (offline-capable)
    - Fetch other users' profiles from PocketBase; show "Profile unavailable offline" when offline
    - Default new profiles to private visibility
    - _Requirements: 13.1–13.6, 15.1_

  - [x] 13.4 Write property test for default profile privacy
    - **Property 18: Default profile privacy**
    - **Validates: Requirements 15.1**

  - [x] 13.5 Write unit tests for profile components
    - Test profile header renders display name, avatar, bio, follower/following counts
    - Test follow button appears on other users' profiles, hidden on own
    - Test all four tabs render correctly
    - Test private items hidden when viewing another user's profile
    - _Requirements: 13.1–13.5, 15.1_

- [x] 14. Build activity feed page
  - [x] 14.1 Create `src/app/feed/page.tsx` with activity feed UI
    - Display reverse-chronological list of feed items from followed users
    - Show action types: review posted, photo shared, trip completed, achievement earned
    - Each feed item navigable to relevant detail screen (park, trail, species, or user profile)
    - Paginate at 20 items per request with "Load More" button
    - Show cached feed items when offline with offline indicator banner
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 14.2 Write unit tests for activity feed
    - Test feed items render with correct action type labels
    - Test navigation links point to correct detail screens
    - Test offline banner appears when offline
    - Test pagination loads additional items
    - _Requirements: 2.1–2.6_

- [x] 15. Implement sync queue ordering and privacy confirmation
  - [x] 15.1 Add visibility confirmation prompt to profile settings
    - When changing trip or expedition log from private to public, show confirmation dialog explaining content will be visible to other users
    - _Requirements: 15.3_

  - [x] 15.2 Write property test for sync queue FIFO ordering
    - **Property 17: Sync queue FIFO ordering**
    - **Validates: Requirements 14.4**

- [x] 16. Wire navigation and integrate all features
  - [x] 16.1 Add activity feed link to bottom navigation
    - Add feed icon/link to `src/components/BottomNav.tsx`
    - Add route for `/feed` page
    - _Requirements: 2.1_

  - [x] 16.2 Add user profile routes for viewing other users
    - Create `src/app/profile/[userId]/page.tsx` for viewing other users' profiles
    - Wire feed item user taps to profile routes
    - _Requirements: 13.1, 2.5_

  - [x] 16.3 Update trail seed data with extended fields
    - Update `src/data/trailsSeed.ts` to include `elevationGain`, `trailType`, `surfaceType`, `trailheads`, `topSights` for existing trails
    - _Requirements: 6.1–6.7, 12.1_

  - [x] 16.4 Write unit tests for navigation and routing
    - Test bottom nav includes feed link
    - Test other-user profile route loads correctly
    - _Requirements: 2.1, 13.1_

- [x] 17. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (19 properties across 13 test files)
- Unit tests validate specific examples, edge cases, and UI rendering
- All social writes go through the existing sync queue for offline support
- The design uses TypeScript throughout; no language selection was needed
