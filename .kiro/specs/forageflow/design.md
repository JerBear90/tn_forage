# ForageFlow Design

## 1. Architecture

ForageFlow is a React/Next.js mobile-first PWA using:

- React / Next.js
- TailwindCSS
- Leaflet
- Recharts
- PocketBase
- IndexedDB
- Service Worker
- Stripe
- OAuth SSO providers

The architecture must be offline-first. Online systems enhance the app but must not be required for core field usage.

---

## 2. Recommended Repository Structure

```txt
forageflow/
  .kiro/
    specs/forageflow/
    steering/
  .github/workflows/
  docs/
    wiki/
    security/
    brand/
    stripe/
  public/
    branding/
  src/
    auth/
    components/
    data/
    hooks/
    layouts/
    map/
    offline/
    pages-or-app/
    services/
    styles/
    types/
  tests/
    e2e/
    unit/
```

---

## 3. Frontend Architecture

### Key Modules

#### App Shell
- PWA shell
- Bottom navigation
- Offline badge
- Global safety disclaimer
- Theme provider
- Auth provider
- Sync provider

#### Field Guide
- Species list
- Species detail
- Compare flow
- Spore Print Guide
- Offline IndexedDB read layer

#### Identify
- Guided ID Wizard
- AI recognition entry
- Result comparison
- Required safety gates

#### Map
- Leaflet map
- Marker clustering
- Park/trail/route panels
- Cached tile logic
- Find Me + manual fallback

#### Trips / Expedition
- Trip creation
- Offline logs
- Photo queue
- Sync state

#### Profile / Membership
- Profile editing
- Avatar upload
- SSO connections
- Stripe membership screen
- Role-gated Super User links

---

## 4. Offline Architecture

### IndexedDB Stores

Recommended stores:

```txt
species
plants
trees
parks
trails
routes
trips
expeditionLogs
photos
userProfileLocal
membershipLocal
authMetaLocal
syncQueue
settings
cachedMapRegions
communityDrafts
```

### Service Worker Cache

Cache:
- App shell
- Static assets
- Logo/icons
- Core CSS/JS
- Field Guide images
- Map tiles after viewing
- Offline fallback page

### Sync Queue

Each queued item:
- localId
- serverId optional
- userId
- collection
- operation
- payload
- payloadHash
- createdAt
- updatedAt
- syncStatus
- retryCount
- clientVersion

---

## 5. Auth + SSO Design

Auth must support:
- Email/password
- Google SSO
- Apple SSO
- Microsoft SSO

Use redirect flow for mobile/PWA reliability.

Auth states:
- unknown
- guest
- authenticated-online
- authenticated-offline
- session-expired
- syncing
- error

First-time login requires internet. Previously authenticated users may reopen offline and access cached field tools.

Protected routes must be offline-aware.

---

## 6. Membership Design

Stripe is server-authoritative. The frontend may display cached membership but cannot grant paid access.

PocketBase user fields:
```json
{
  "role": "guest|free|member|super_user",
  "membershipPlan": "free|monthly|yearly|lifetime|admin",
  "membershipStatus": "inactive|active|trialing|past_due|canceled",
  "stripeCustomerId": "string",
  "subscriptionId": "string",
  "currentPeriodEnd": "datetime",
  "membershipLastVerifiedAt": "datetime"
}
```

---

## 7. Data Model Summary

### User
- id
- email
- displayName
- avatar
- role
- membershipPlan
- membershipStatus
- createdAt
- updatedAt

### Species
- id
- commonName
- scientificName
- category
- images
- habitat
- treeAssociations
- season
- region
- identificationSteps
- lookalikes
- toxicLookalikes
- sporePrint
- bruisingNotes
- edibilityLabel
- safetyNotes
- sources
- lastUpdated

### Park
- id
- name
- region
- coordinates
- image
- amenities
- trails
- hours
- fees
- foragingRules
- lastUpdated

### Trail
- id
- parkId
- name
- distance
- difficulty
- coordinates
- elevationProfile
- likelyTrees
- likelySpecies
- images
- lastUpdated

### Trip
- id
- userId
- locationType
- locationId
- customLocation
- date
- notes
- targetSpecies
- syncStatus

### ExpeditionLog
- id
- userId
- tripId
- photos
- coordinates
- speciesGuess
- notes
- habitat
- treeNearby
- visibility
- syncStatus

---

## 8. UI Design

### Brand
- Teal primary
- Forest/moss green secondary
- Sand/cream background
- Charcoal text
- Earth brown accents

### Typography
- Inter primary
- Poppins headings optional
- Sans-serif only

### Mobile Layout
- Bottom navigation
- Thumb-friendly CTAs
- Persistent close/back controls
- No trapped modals
- Large map controls

---

## 9. Safety Design

Global safety banner required on first use.

Safety language:
- “Possible match”
- “Commonly considered edible with expert confirmation”
- “Verify with a qualified expert before consuming”

Forbidden:
- “Safe to eat”
- “Confirmed edible”
- “AI verified”

---

## 10. Testing Design

Testing levels:
- Unit
- Integration
- E2E
- Offline/PWA
- Mobile viewport
- Accessibility
- Security
- Regression

CI must run:
- Lint
- Typecheck
- Unit tests
- Build
- Optional Playwright E2E
