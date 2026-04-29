# ForageFlow Requirements

## 1. Project Overview

### Project Name
ForageFlow

### Purpose
ForageFlow is a mobile-first, offline-first field app for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee. It helps users identify possible species, compare lookalikes, understand habitat, plan trips, log findings, and safely learn from expert-backed content.

This app is not a food safety authority. It must never confirm that a mushroom or plant is safe to consume.

### Target Users
- Beginner mushroom hunters
- Intermediate foragers
- Hikers and campers
- Outdoor educators
- Naturalists
- Tennessee park and trail explorers
- Community contributors
- Super Users / content moderators

### Core Principles
- Offline-first
- Mobile-ready
- Safety-first
- Identification assistance only
- No AI-only edibility decisions
- Clear lookalike comparison
- Fast field use
- Secure authentication and membership
- Privacy-first location handling

---

## 2. Feature Specifications

### 2.1 Home Page
The Home Page must provide fast access to core tools.

Required:
- Animated logo intro, 2–3 seconds max
- Skippable intro
- Intro shown once, then cached
- Quick buttons:
  - Find Me
  - Identify
  - Field Guide
  - Map
  - Create Trip
- Seasonal highlights
- Nearby suggestions
- Offline Mode badge when offline
- Safety disclaimer entry point

Acceptance:
- Loads on mobile in under 3 seconds
- Does not block app use if animation fails
- Works offline after first load

---

### 2.2 Field Guide
The Field Guide must work offline and include mushrooms, plants, and trees.

Each species entry must include:
- Common name
- Scientific name
- Category
- Images
- Cap/leaf/bark/stem detail images where applicable
- Habitat
- Tree association
- Season
- Region
- Identification steps
- Lookalikes
- Toxic lookalikes shown first
- Spore print for mushrooms
- Bruising/cut notes where relevant
- Edibility label:
  - Commonly considered edible with expert confirmation
  - Toxic
  - Inedible
  - Unknown
- Safety notes
- Source references/internal citation metadata
- Last updated date

Acceptance:
- No species entry may use the phrase “safe to eat”
- Toxic lookalikes must appear before edible notes
- Field Guide works offline from IndexedDB/cache

---

### 2.3 Lookalike Comparisons
The app must support side-by-side comparisons.

Required:
- Multi-select comparison
- 2–4 items at once
- Expandable images
- Highlight:
  - Cap shape/color
  - Underside
  - Stem/stalk
  - Habitat
  - Tree association
  - Season
  - Edibility warning
- Toxic lookalikes appear first

Acceptance:
- Works offline
- Images enlarge on mobile
- Comparison layout remains readable on iPhone

---

### 2.4 Spore Print Guide
Required:
- Step-by-step spore print instructions
- Color reference guide
- Species-linked spore print expectations
- Safety warning that spore print is not enough alone

Acceptance:
- Works offline
- Available from Field Guide and Identify flow

---

### 2.5 Guided ID Wizard
The app must include manual step-by-step identification.

Required questions:
- Underside type:
  - Gills
  - Pores
  - Teeth
  - Smooth
  - Unknown
- Growth location:
  - Soil
  - Dead wood
  - Living tree
  - Leaf litter
  - Moss
  - Unknown
- Nearby tree:
  - Oak
  - Hickory
  - Elm
  - Maple
  - Pine
  - Poplar
  - Unknown
- Cap color
- Cap shape
- Stem features
- Bruising/cut reaction
- Season
- Habitat moisture
- GPS/manual location optional

Results:
- Strong possible match
- Possible match
- Low confidence
- Insufficient information

Never show:
- Confirmed
- Safe to eat
- Definitely edible

Acceptance:
- Works offline using local species data
- Forces lookalike review before showing edible notes

---

### 2.6 AI Photo Recognition
AI recognition is assistive only.

Inputs:
- Camera capture
- Gallery upload
- Recommended multi-photo set:
  - Top view
  - Underside
  - Habitat
  - Stem/base

Outputs:
- Top possible matches
- Confidence scores
- Similar species
- Toxic lookalikes
- Manual verification checklist

Required warning:
“Possible match only. Not safe for consumption decisions.”

Offline behavior:
- Disable AI recognition or queue analysis until connection returns
- If queued, save image locally with timestamp/location/user notes

Acceptance:
- AI never says “safe to eat”
- AI mismatch with manual wizard triggers: “Uncertain result — verify manually.”

---

### 2.7 Habitat Matcher
The Habitat Matcher must answer: “What might I find where I am right now?”

Inputs:
- GPS or manual location
- Season
- Habitat type
- Tree association
- Moisture
- Optional elevation
- Optional recent rainfall

Outputs:
- Likely mushrooms/plants nearby
- Habitat checklist
- Soil, bark, deadwood, leaf litter, moisture indicators
- Habitat photos/details
- Safety warnings

Acceptance:
- Basic matching works offline
- Live weather/rainfall requires connection and fails gracefully

---

### 2.8 Tree Identification
Required:
- Upload or take tree photo
- Suggest tree type when online AI is available
- Manual tree guide works offline
- Bark, leaves, shape, and habitat images
- Show mushrooms commonly associated with selected tree

Acceptance:
- Tree association appears in species and habitat flows

---

### 2.9 Map System
Use Leaflet. Do not replace Leaflet.

Required layers:
- Tennessee State Parks
- Trails
- Routes
- Saved trips
- Expedition logs
- Optional species observations

Map behavior:
- One “Find Me” button only
- GPS request works on iPhone Safari and Android Chrome
- Manual location fallback
- Last cached location fallback
- Markers clickable
- Panels do not disappear too quickly
- Route panels stay open until closed
- No navigation lock
- List view includes images
- Map tiles cached for previously viewed areas
- Marker clustering if performance requires it

Acceptance:
- Works on mobile
- Previously viewed map areas available offline
- Park/trail/route details open reliably

---

### 2.10 State Parks Database
Include Tennessee State Parks.

Each park:
- Name
- Region
- Address/location
- Image
- Amenities
- Trails/routes
- Hours if known
- Fees if known
- Foraging rule message
- Last updated date

Foraging rule fallback:
“Verify local regulations before collecting. Identification only unless permitted.”

Acceptance:
- No park may imply foraging is allowed unless verified

---

### 2.11 Routes & Trails
Each trail/route:
- Name
- Park/location
- Distance
- Difficulty
- Elevation if available
- Trailhead vegetation
- Likely trees
- Possible seasonal species
- Route panel
- Images
- Offline cached detail page

Acceptance:
- Clicking route does not lock navigation
- Route panel persists until user closes it

---

### 2.12 Trip Planner
Flow:
1. User taps Create Trip
2. App asks where:
   - Park
   - Trail
   - Route
   - Custom location
3. User adds:
   - Date
   - Notes
   - Target species
   - Companions optional
   - Safety notes optional
4. Save locally first
5. Sync when online

Acceptance:
- Trip creation works offline
- Trip associates with selected location

---

### 2.13 Expedition Log
Required:
- Quick Log Mode
- Photo capture
- Gallery upload
- Caption
- Date/time
- GPS or manual location
- Species guess
- Habitat notes
- Tree nearby
- Private/public setting
- Sync status

Acceptance:
- Photos save offline locally first
- Logs sync when connection returns

---

### 2.14 Trips Page
Required:
- List saved trips
- Search/filter
- Trip status
- Edit/delete
- Offline support
- Sync indicator

---

### 2.15 Challenges
Challenges must not auto-complete incorrectly.

Required:
- Explicit completion criteria
- User progress tracking
- No completed status without completed actions
- Offline progress support

Acceptance:
- New users have zero completed challenges unless seeded intentionally

---

### 2.16 Species Passport
Tracks species encountered.

Required:
- Manual additions
- Expedition-linked additions
- Possible/unverified status
- Never treat AI match as confirmed

---

### 2.17 Analytics Dashboard
Provide activity insights:
- Trips completed
- Logs created
- Species explored
- Offline sync queue status
- Membership usage if applicable

Do not build complex analytics before core tools work.

---

### 2.18 Elevation Profiles
Optional advanced feature:
- Trail elevation profile
- Species elevation preference
- Recharts visualization

---

### 2.19 Seasonal Calendar
Required:
- Month-by-month likely species
- Tennessee-specific seasonal guidance
- Offline availability

---

### 2.20 Trail Conditions
Required:
- Manual/status notes
- Last updated
- Online source support if available later
- Offline cached display

---

### 2.21 Wildlife Alerts
Safety-oriented feature:
- Region-based warnings
- Offline cached alerts
- Clear emergency disclaimer

---

### 2.22 Audio Library
Optional Phase 2/3:
- Educational clips
- Nature audio
- Offline cached if downloaded

---

### 2.23 Community
Community content is separate from expert content.

Required:
- User sightings
- Comments
- Suggested IDs
- Flag unsafe/incorrect content
- Private-by-default logs
- Public sharing opt-in
- Location fuzzing for public posts
- Future verified expert badge support

Acceptance:
- Community content may not override safety warnings
- Community ID is not expert confirmation

---

### 2.24 Expert Content
Expert-backed content must come from:
- University extension resources
- State park guidance
- Mycology organizations
- Expert-written field guides
- Reputable mushroom education sources

Requirements:
- Store source metadata internally
- Mark content as expert-backed
- Do not scrape random forums as verified truth

---

### 2.25 Profile & Settings
Required:
- Edit name
- Edit email
- Upload avatar
- Camera upload
- Gallery upload
- Crop/preview if practical
- Dark mode toggle
- Light mode
- Saved trips
- Expedition logs
- Community activity
- Membership screen
- Account delete request support

---

### 2.26 Authentication
Required:
- Email/password signup
- Email/password login
- Persistent sessions
- Logout
- Offline reopen after prior login
- SSO with Google, Apple, and Microsoft
- Protected routes
- Role gates

First-time login requires internet.

Previously authenticated users may use cached offline tools.

---

### 2.27 Membership
Roles:
- Guest
- Free User
- Paid Member
- Super User

Free:
- Field Guide
- Basic map
- Trips/logs
- Limited AI usage

Paid Member:
- Extended offline species packs
- Advanced filters
- Higher AI limits
- Cloud sync
- Premium trip tools

Super User:
- Admin/content moderation
- Safety notice tools
- Species editor
- Data refresh review
- Community moderation

Acceptance:
- Membership cannot be granted by frontend
- Stripe webhooks are source of truth

---

### 2.28 Stripe Integration
Required:
- Stripe Checkout
- Monthly/yearly plans
- Webhook validation
- PocketBase membership updates

Handle:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

Acceptance:
- Stripe secret keys never exposed to frontend

---

### 2.29 Bottom Navigation
Required:
- Mobile-first bottom nav
- Large tap targets
- No nav lock
- Accessible labels

Suggested tabs:
- Home
- Identify
- Field Guide
- Map
- Trips/Profile

---

## 3. Offline-First Requirements

The following must work offline:
- Field Guide
- Species details
- Lookalikes
- Spore Print Guide
- Basic Habitat Matcher
- Saved trips
- Expedition logs
- Cached maps
- Saved images
- Local profile state

Storage:
- IndexedDB for data
- Service Worker for app shell/images/map tiles

Sync status:
- Offline
- Syncing
- Up to date

If offline:
- Disable or queue AI
- Disable live community
- Disable Stripe checkout
- Allow local trip/log/photo capture

---

## 4. Mobile Requirements

Primary:
- iPhone Safari
- Android Chrome

Required:
- PWA install
- App icon
- Splash screen
- Fullscreen mode
- Large tap targets
- Minimal typing
- Smooth map
- No blocking scripts
- Load under 3 seconds

---

## 5. Accessibility Requirements

WCAG AA:
- Contrast compliant
- No white text on light backgrounds
- Keyboard navigation
- Screen reader labels
- Proper form labels
- Large tap targets
- Adjustable text or scalable layout
- Modal focus management

---

## 6. Branding Requirements

Brand name: ForageFlow

Colors:
- Primary Teal: #0F766E
- Forest Green: #14532D
- Moss Green: #4D7C0F
- Earth Brown: #7C4A24
- Sand/Cream: #F5F0DF
- Charcoal: #1F2937

Fonts:
- Inter
- Poppins
- Nunito Sans fallback

Logo:
- Mushroom + map pin hybrid
- Leaf accent
- Must work light/dark
- SVG primary asset required

---

## 7. Security Requirements

- Do not expose secrets
- Do not store provider tokens in plain localStorage
- Server-side role validation
- Stripe webhook verification
- User ownership checks on sync
- Private-by-default expedition logs
- Super User actions server-validated
- Account deletion/export support planned

---

## 8. Completion Requirements

The build is not complete unless:
- Offline core works
- Mobile map works
- GPS fallback works
- Trips/logs save offline
- Images persist
- AI safety copy is enforced
- SSO works online
- Offline reopen works after prior login
- Membership cannot be spoofed
- Super User routes are protected
- All tests pass
