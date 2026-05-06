# Requirements Document — Social Profile and Park Details

## Introduction

This feature extends ForageWise with two complementary capabilities: (1) a social layer that lets users follow other foragers, view an activity feed, share photos, write reviews, and track completed trips and achievements; and (2) a rich park and trail detail experience that surfaces trail length, elevation, difficulty, surface type, trailhead locations, estimated hiking time, user reviews, trail maps, photo tours, directions, weather links, top sights, and park contact information. Both areas must preserve ForageWise's offline-first, mobile-first, and safety-first principles.

## Glossary

- **Follow_System**: The server-side subsystem that manages directional follow relationships between authenticated users.
- **Activity_Feed**: The screen that displays a chronological list of actions performed by users the current user follows.
- **Photo_Gallery**: The component that displays user-uploaded photos associated with a park, trail, or species review.
- **Review**: A user-submitted text and optional star-rating evaluation attached to a park, trail, or species.
- **Review_Service**: The server-side subsystem that stores, validates, and retrieves reviews.
- **Achievement**: A recorded milestone derived from a user's completed trips, challenges, or expedition logs.
- **Achievement_Tracker**: The subsystem that evaluates user activity against achievement criteria and records completions.
- **Park_Detail_Page**: The enhanced detail screen for a single park, displaying all extended park and trail metadata.
- **Trail_Detail_Panel**: The panel or page displaying extended metadata for a single trail within a park.
- **Trail_Map_Renderer**: The Leaflet-based component that draws a trail route polyline on an interactive map.
- **Directions_Link**: A deep link that opens an external maps application (Google Maps, Apple Maps) with the park or trailhead coordinates.
- **Weather_Link**: A link or embedded widget that shows current weather conditions for the park's geographic coordinates.
- **Photo_Tour**: A swipeable gallery of user-submitted and seed photos for a park or trail.
- **Profile_Page**: The user's public-facing profile showing display name, avatar, bio, completed trips, achievements, and reviews.
- **Sync_Queue**: The existing IndexedDB-backed queue that buffers offline writes for later server synchronization.
- **PocketBase_Backend**: The PocketBase server that stores authoritative social data (follows, reviews, photos, achievements).

## Requirements

### Requirement 1: Follow Other Users

**User Story:** As a forager, I want to follow other users, so that I can keep up with their foraging activity and discoveries.

#### Acceptance Criteria

1. WHEN an authenticated user taps the follow button on another user's Profile_Page, THE Follow_System SHALL create a directional follow relationship from the current user to the target user.
2. WHEN an authenticated user taps the unfollow button on a followed user's Profile_Page, THE Follow_System SHALL remove the follow relationship.
3. THE Follow_System SHALL enforce follow relationships on the PocketBase_Backend with server-side role validation.
4. WHEN a user views their own Profile_Page, THE Profile_Page SHALL display the count of followers and the count of users they follow.
5. IF a follow or unfollow request fails due to network unavailability, THEN THE Sync_Queue SHALL enqueue the operation for retry when connectivity is restored.
6. THE Follow_System SHALL prevent a user from following themselves.

### Requirement 2: Activity Feed

**User Story:** As a forager, I want to see an activity feed of people I follow, so that I can discover new parks, trails, and species through their activity.

#### Acceptance Criteria

1. WHEN an authenticated user opens the Activity_Feed, THE Activity_Feed SHALL display a reverse-chronological list of actions from followed users.
2. THE Activity_Feed SHALL include the following action types: new review posted, photo shared, trip completed, and achievement earned.
3. WHEN the device is online, THE Activity_Feed SHALL fetch the latest actions from the PocketBase_Backend.
4. WHILE the device is offline, THE Activity_Feed SHALL display the most recently cached feed items from IndexedDB.
5. WHEN the user taps a feed item, THE Activity_Feed SHALL navigate to the relevant detail screen (park, trail, species, or user profile).
6. THE Activity_Feed SHALL paginate results, loading a maximum of 20 items per request.

### Requirement 3: Photo Sharing

**User Story:** As a forager, I want to share photos from my expeditions, so that other users can see what I found and where.

#### Acceptance Criteria

1. WHEN an authenticated user uploads a photo from the expedition log or a park/trail detail screen, THE Photo_Gallery SHALL associate the photo with the relevant park, trail, or species.
2. THE Photo_Gallery SHALL accept JPEG and PNG images with a maximum file size of 10 MB per image.
3. WHILE the device is offline, THE Photo_Gallery SHALL store the photo in IndexedDB and enqueue the upload in the Sync_Queue.
4. WHEN the photo is synced to the PocketBase_Backend, THE Photo_Gallery SHALL generate a thumbnail for feed and gallery display.
5. THE Photo_Gallery SHALL strip EXIF GPS data from photos before uploading to the PocketBase_Backend unless the user explicitly opts in to location sharing.
6. IF a photo upload fails after three retry attempts, THEN THE Sync_Queue SHALL mark the item as failed and notify the user.

### Requirement 4: Reviews

**User Story:** As a forager, I want to write reviews of parks, trails, and species, so that I can share my experience and help other foragers plan their trips.

#### Acceptance Criteria

1. WHEN an authenticated user submits a review on a Park_Detail_Page or Trail_Detail_Panel, THE Review_Service SHALL store the review with the user ID, target entity ID, star rating (1–5), text body, and timestamp.
2. THE Review_Service SHALL enforce a maximum of one review per user per target entity; subsequent submissions SHALL update the existing review.
3. WHEN a user views a Park_Detail_Page or Trail_Detail_Panel, THE Park_Detail_Page SHALL display the average star rating and the total review count.
4. WHEN a user views the reviews section, THE Review_Service SHALL return reviews sorted by most recent first with pagination of 10 reviews per page.
5. WHILE the device is offline, THE Review_Service SHALL save the review draft to IndexedDB and enqueue it in the Sync_Queue for later submission.
6. IF a review contains text shorter than 10 characters, THEN THE Review_Service SHALL reject the submission and display a validation message.
7. THE Review_Service SHALL enforce review content validation on the PocketBase_Backend to prevent empty or excessively long submissions (maximum 2000 characters).

### Requirement 5: Completed Trips and Achievements

**User Story:** As a forager, I want to see my completed trips and earned achievements on my profile, so that I can track my progress and share it with others.

#### Acceptance Criteria

1. WHEN a user marks a trip as completed, THE Achievement_Tracker SHALL evaluate the trip against all active achievement criteria.
2. WHEN an achievement criterion is met, THE Achievement_Tracker SHALL record the achievement with a timestamp and display a notification to the user.
3. WHEN a user views their own Profile_Page, THE Profile_Page SHALL display a list of completed trips with date, location name, and species found.
4. WHEN a user views their own Profile_Page, THE Profile_Page SHALL display earned achievements with title, description, and date earned.
5. WHEN another user views a Profile_Page, THE Profile_Page SHALL display only trips and achievements the profile owner has set to public visibility.
6. THE Achievement_Tracker SHALL store achievement data in IndexedDB for offline access and sync to the PocketBase_Backend when online.

### Requirement 6: Enhanced Park Detail — Trail Metadata

**User Story:** As a hiker and forager, I want to see detailed trail information for each park, so that I can choose trails that match my fitness level and available time.

#### Acceptance Criteria

1. THE Park_Detail_Page SHALL display each trail's length in miles.
2. THE Park_Detail_Page SHALL display each trail's elevation gain in feet.
3. THE Park_Detail_Page SHALL display each trail's estimated hiking time based on a standard pace calculation (Naismith's rule: 3 mph base plus 30 minutes per 1000 feet of elevation gain).
4. THE Park_Detail_Page SHALL display each trail's difficulty rating using the existing TrailDifficulty scale (easy, moderate, hard, expert).
5. THE Park_Detail_Page SHALL display each trail's type as one of: loop, out-and-back, or point-to-point.
6. THE Park_Detail_Page SHALL display each trail's surface type (paved, gravel, dirt, rocky, or mixed).
7. THE Park_Detail_Page SHALL display trailhead locations as named starting points with GPS coordinates.
8. WHILE the device is offline, THE Park_Detail_Page SHALL render all trail metadata from IndexedDB without requiring a network connection.

### Requirement 7: Enhanced Park Detail — Trail Map

**User Story:** As a hiker, I want to see a map of each trail with the route drawn on it, so that I can understand the trail layout before I go.

#### Acceptance Criteria

1. WHEN a user views a trail on the Park_Detail_Page, THE Trail_Map_Renderer SHALL display a Leaflet map with the trail route drawn as a polyline using the trail's coordinate array.
2. THE Trail_Map_Renderer SHALL display trailhead markers at each trailhead location on the map.
3. THE Trail_Map_Renderer SHALL allow the user to zoom and pan the trail map.
4. WHILE the device is offline, THE Trail_Map_Renderer SHALL render the trail polyline over cached map tiles from the cachedMapRegions store.
5. THE Trail_Map_Renderer SHALL fit the map bounds to the trail extent on initial load.

### Requirement 8: Enhanced Park Detail — Reviews and Ratings Display

**User Story:** As a forager, I want to see reviews and ratings on park and trail detail pages, so that I can learn from other foragers' experiences.

#### Acceptance Criteria

1. WHEN a user views the Park_Detail_Page, THE Park_Detail_Page SHALL display the aggregate star rating (1–5, one decimal place) and total review count.
2. WHEN a user views the Park_Detail_Page, THE Park_Detail_Page SHALL display a list of the most recent reviews with author name, star rating, date, and review text.
3. WHEN a user taps "Write a Review," THE Park_Detail_Page SHALL present the review submission form (as defined in Requirement 4).
4. WHILE the device is offline, THE Park_Detail_Page SHALL display cached reviews from IndexedDB.

### Requirement 9: Enhanced Park Detail — Photo Tour

**User Story:** As a forager, I want to browse photos of a park or trail before visiting, so that I can preview the terrain and scenery.

#### Acceptance Criteria

1. WHEN a user views the Park_Detail_Page, THE Photo_Tour SHALL display a horizontally swipeable gallery of photos associated with the park.
2. THE Photo_Tour SHALL display seed photos (from the park's image field) first, followed by user-submitted photos sorted by most recent.
3. WHEN a user taps a photo in the Photo_Tour, THE Photo_Tour SHALL open a full-screen lightbox view with swipe navigation.
4. WHILE the device is offline, THE Photo_Tour SHALL display only photos that have been cached locally.

### Requirement 10: Enhanced Park Detail — Directions and Getting There

**User Story:** As a visitor, I want to get directions to a park or trailhead, so that I can navigate there using my preferred maps application.

#### Acceptance Criteria

1. WHEN a user taps the "Get Directions" button on the Park_Detail_Page, THE Directions_Link SHALL open the device's default maps application with the park's GPS coordinates as the destination.
2. WHEN a user taps the "Get Directions" button on a specific trailhead, THE Directions_Link SHALL open the maps application with the trailhead's GPS coordinates as the destination.
3. THE Park_Detail_Page SHALL display a "Getting There" section with parking information and driving notes when available in the park data.
4. IF the park data does not include parking or driving information, THEN THE Park_Detail_Page SHALL omit the "Getting There" section rather than displaying empty content.

### Requirement 11: Enhanced Park Detail — Weather

**User Story:** As a forager, I want to check the weather at a park before heading out, so that I can plan my trip safely.

#### Acceptance Criteria

1. WHEN a user views the Park_Detail_Page and the device is online, THE Weather_Link SHALL display a link to a weather service (e.g., weather.gov) pre-populated with the park's GPS coordinates.
2. WHILE the device is offline, THE Park_Detail_Page SHALL hide the weather link and display a message indicating that weather data requires an internet connection.

### Requirement 12: Enhanced Park Detail — Top Sights and Contact Information

**User Story:** As a visitor, I want to see notable sights along a trail and contact information for the park, so that I can plan my visit and reach the park office if needed.

#### Acceptance Criteria

1. THE Park_Detail_Page SHALL display a "Top Sights" section listing notable points of interest along each trail when available in the trail data.
2. THE Park_Detail_Page SHALL display park contact information (phone number and website URL) when available in the park data.
3. WHEN a user taps a phone number, THE Park_Detail_Page SHALL initiate a phone call using the device's native dialer.
4. WHEN a user taps a website URL, THE Park_Detail_Page SHALL open the URL in the device's default browser.
5. IF the park data does not include contact information, THEN THE Park_Detail_Page SHALL omit the contact section rather than displaying empty content.

### Requirement 13: Public User Profile

**User Story:** As a forager, I want a public profile page that shows my activity, so that other users can learn about my foraging experience.

#### Acceptance Criteria

1. THE Profile_Page SHALL display the user's display name, avatar, and optional bio.
2. THE Profile_Page SHALL display the user's follower count and following count.
3. THE Profile_Page SHALL display tabs for completed trips, achievements, reviews, and shared photos.
4. WHEN viewing another user's Profile_Page, THE Profile_Page SHALL display only content the profile owner has set to public visibility.
5. THE Profile_Page SHALL include a follow/unfollow button when viewing another user's profile (as defined in Requirement 1).
6. WHILE the device is offline, THE Profile_Page SHALL display cached profile data from IndexedDB for the current user's own profile.

### Requirement 14: Offline-First Data Integrity

**User Story:** As a forager in the field, I want all social and park detail features to degrade gracefully when offline, so that I can still access critical trail information without connectivity.

#### Acceptance Criteria

1. THE Park_Detail_Page SHALL render all trail metadata (length, elevation, difficulty, type, surface, trailheads) from IndexedDB without requiring a network connection.
2. WHILE the device is offline, THE Review_Service SHALL queue new reviews in the Sync_Queue and submit them when connectivity is restored.
3. WHILE the device is offline, THE Photo_Gallery SHALL store photos locally and enqueue uploads in the Sync_Queue.
4. WHEN connectivity is restored, THE Sync_Queue SHALL process pending social actions (follows, reviews, photos) in the order they were created.
5. IF a sync conflict occurs (e.g., a review was edited on another device), THEN THE Sync_Queue SHALL preserve the most recent local version and flag the conflict for user resolution.
6. THE Park_Detail_Page SHALL indicate which data sections are unavailable offline (weather, live reviews from other users) with a clear visual indicator.

### Requirement 15: Safety and Privacy Defaults

**User Story:** As a forager, I want my location and activity to be private by default, so that I am in control of what I share.

#### Acceptance Criteria

1. THE Profile_Page SHALL default all new user profiles to private visibility for trips and expedition logs.
2. THE Photo_Gallery SHALL strip EXIF GPS metadata from uploaded photos by default.
3. WHEN a user changes a trip or expedition log from private to public, THE Profile_Page SHALL display a confirmation prompt explaining that the content will be visible to other users.
4. THE Follow_System SHALL allow any authenticated user to follow any other user (public follow model), but followed users' private content SHALL remain hidden.
5. THE Review_Service SHALL associate reviews with the author's display name only; THE Review_Service SHALL NOT expose the author's email address or precise GPS coordinates.
