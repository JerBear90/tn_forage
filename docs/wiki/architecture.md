# ForageFlow Architecture

## Overview

ForageFlow is an offline-first Progressive Web App built with Next.js 14 (App Router), React, TailwindCSS, and TypeScript. The architecture prioritizes offline reliability, mobile usability, and mushroom/plant safety.

## System Layers

```
┌─────────────────────────────────────────────────┐
│                   UI Shell                       │
│  App Layout · Bottom Nav · Theme · Offline Badge │
├─────────────────────────────────────────────────┤
│                 Page Layer                        │
│  Field Guide · Map · Trips · Identify · Profile  │
│  Community · Challenges (Phase 2)                │
├─────────────────────────────────────────────────┤
│               React Hooks Layer                   │
│  useAuth · useSpecies · useTrips · useMapData    │
│  useGeolocation · useOnlineStatus · useSyncStatus│
│  useChallenges · useSeasonalHighlights (Phase 2) │
│  useCommunityPreview · useAssociatedSpeciesLookup│
├─────────────────────────────────────────────────┤
│              Services Layer                       │
│  identifyScoring · locationPrivacy               │
│  membershipPlanHierarchy · verificationChecklist │
├─────────────────────────────────────────────────┤
│              Auth Layer                           │
│  authService · AuthProvider · RoleGate           │
│  SuperUserGate · ProtectedRoute · roleHierarchy  │
├─────────────────────────────────────────────────┤
│            Offline Data Layer                     │
│  IndexedDB (idb) · Sync Queue · Service Worker   │
│  18 stores incl. challenges (Phase 2)            │
├─────────────────────────────────────────────────┤
│             External Services                     │
│  PocketBase · Stripe · OAuth Providers · Leaflet │
└─────────────────────────────────────────────────┘
```

## Key Modules

### App Shell (`src/app/layout.tsx`)
- PWA shell with `<html>` and `<body>` setup
- AuthProvider wraps all pages
- ThemeProvider for dark/light mode
- Bottom navigation (BottomNav.tsx)
- Offline badge (OfflineBadge.tsx)
- Safety disclaimer (SafetyDisclaimer.tsx)
- Sync status indicator (SyncStatusIndicator.tsx)

### Auth (`src/auth/`)
- `authService.ts` — PocketBase auth, SSO redirect flow, offline session restore
- `AuthProvider.tsx` — React context provider for auth state
- `useAuth.ts` — Hook exposing user, role, membership, auth state
- `RoleGate.tsx` — Restricts content by role hierarchy (guest < free < member < super_user)
- `SuperUserGate.tsx` — Convenience wrapper for super_user-only content
- `ProtectedRoute.tsx` — Redirects unauthenticated users, offline-aware
- `roleHierarchy.ts` — Pure function role comparison utilities

### Offline (`src/offline/`)
- `db.ts` — IndexedDB wrapper with 18 typed stores, generic CRUD helpers
- `syncQueue.ts` — Queue operations (enqueue, dequeue, markDone, markFailed, retryFailed)

### Services (`src/services/`)
- `identifyScoring.ts` — Guided ID Wizard scoring logic
- `locationPrivacy.ts` — GPS coordinate fuzzing for public posts (~1 km offset)
- `membershipPlanHierarchy.ts` — Plan comparison (free < monthly < yearly < lifetime < admin)
- `verificationChecklist.ts` — Lookalike verification before showing edible notes

### Map (`src/map/`)
- `ForageFlowMap.tsx` — Leaflet map with parks, trails, routes layers
- `MapDetailPanel.tsx` — Clickable marker detail panels (persistent until closed)
- `MapListView.tsx` — Thumbnail list view alongside map

### Data (`src/data/`)
- Seed data for species, plants, trees, parks, trails, routes, and challenges
- `seedDatabase.ts` — Seeds IndexedDB on first load (idempotent — checks store counts before seeding)

### API Routes (`src/app/api/`)
- `stripe/checkout/` — Creates Stripe Checkout sessions (server-side)
- `stripe/webhook/route.ts` — Processes Stripe webhook events with signature verification

## Data Flow

### Online Flow
```
User Action → React Hook → PocketBase API → Response → Update UI + IndexedDB
```

### Offline Flow
```
User Action → React Hook → IndexedDB (read/write) → Update UI
                         → Sync Queue (if write) → Process when online
```

### Auth Flow
```
Login/SSO → PocketBase Auth → Persist to IndexedDB (authMetaLocal + userProfileLocal)
Offline Reopen → Restore from IndexedDB → authenticated-offline state
```

### Stripe Flow
```
User clicks Upgrade → Server creates Checkout Session → Stripe hosted page
Payment complete → Stripe webhook → Server verifies signature → Update PocketBase user
```

## Phase 2 Additions

### Challenges System

Phase 2 introduced a challenges system for foraging, seasonal, and park exploration challenges. Challenge progress is stored entirely in IndexedDB, keeping the offline-first architecture consistent with no backend dependency for challenge tracking.

**New hook:** `src/hooks/useChallenges.ts` — Loads challenges from IndexedDB, provides `updateCriterion()` for marking criteria complete, and `getChallengesPreview()` for the home page (returns up to 3 non-completed challenges).

**New components:**
- `ChallengesCard.tsx` — Renders a single challenge with progress bar and criteria checkboxes
- `ChallengesSection.tsx` — Displays challenge list, supports preview mode for the home page

**Completion invariant:** A challenge is marked completed (`completedAt` set) if and only if every criterion in its `criteria` array has `completed === true`. The system never auto-completes challenges.

### Challenges Data Flow

```
Home Page / Challenges View
    → useChallenges hook
    → IndexedDB `challenges` store (read)
    → Render ChallengesSection → ChallengesCard

User checks criterion
    → updateCriterion(challengeId, criterionId, completed)
    → IndexedDB `challenges` store (write)
    → If all criteria complete → set completedAt
    → Re-render with updated progress
```

### IndexedDB Stores (18 total)

**Database name:** `forageflow`
**Version:** 2 (upgraded from 1 in Phase 2 to add the `challenges` store)

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| `species` | `id` | by-category, by-commonName, by-scientificName, by-edibilityLabel, by-lastUpdated | Mushroom species data |
| `plants` | `id` | by-commonName, by-scientificName, by-edibilityLabel, by-lastUpdated | Plant species data |
| `trees` | `id` | by-commonName, by-scientificName, by-lastUpdated | Tree species data |
| `parks` | `id` | by-name, by-region, by-lastUpdated | Tennessee state parks |
| `trails` | `id` | by-parkId, by-name, by-difficulty, by-lastUpdated | Trail data |
| `routes` | `id` | by-parkId, by-name, by-difficulty, by-lastUpdated | Route data |
| `trips` | `id` | by-userId, by-date, by-syncStatus | User trips |
| `expeditionLogs` | `id` | by-userId, by-tripId, by-syncStatus | Expedition log entries |
| `photos` | `id` | by-expeditionLogId, by-syncStatus | Expedition photos as blobs |
| `userProfileLocal` | `id` | — | Cached user profile for offline display |
| `membershipLocal` | `id` | by-userId | Cached membership status |
| `authMetaLocal` | `id` | — | Auth state metadata for offline session restore |
| `syncQueue` | `localId` | by-userId, by-collection, by-syncStatus | Pending sync operations |
| `settings` | `id` | — | App settings (theme preference, etc.) |
| `cachedMapRegions` | `id` | — | Metadata for cached map tile regions |
| `communityDrafts` | `id` | — | Offline community post drafts |
| `communityFlags` | `id` | — | Content flags for moderation |
| `challenges` | `id` | by-category, by-completedAt | Foraging, seasonal, and park exploration challenges (Phase 2) |

The version 2 upgrade logic in `getDB()` creates the `challenges` store with its indexes when upgrading from version 1. New installs create all 18 stores in a single upgrade pass.

### Service Worker Caching Strategy

The Service Worker is configured in `next.config.mjs` via `@ducanh2912/next-pwa` with Workbox. It is disabled in development mode.

| Content | Strategy | Cache Name | TTL |
|---------|----------|------------|-----|
| Branding assets (logos) | CacheFirst | `branding-assets` | 30 days |
| PWA icons | CacheFirst | `icon-assets` | 30 days |
| Species images | CacheFirst | `field-guide-species-images` | 30 days |
| Google Fonts (woff2) | CacheFirst | `google-fonts-webfonts` | 1 year |
| Google Fonts (CSS) | StaleWhileRevalidate | `google-fonts-stylesheets` | 7 days |
| Next.js static JS | CacheFirst | `next-static-js-assets` | 1 day |
| CSS files | StaleWhileRevalidate | `static-style-assets` | 1 day |
| General images | StaleWhileRevalidate | `static-image-assets` | 30 days |
| Map tiles (OSM) | StaleWhileRevalidate | `map-tiles-osm` | 30 days |
| Map tiles (CDN) | StaleWhileRevalidate | `map-tiles-cdn` | 30 days |
| API routes | NetworkFirst | `apis` | 1 day |
| Page navigations | NetworkFirst | `pages` | 1 day |
| Cross-origin | NetworkFirst | `cross-origin` | 1 hour |

**Offline fallback:** When a navigation request fails both network and cache, the Service Worker serves `/~offline` — a friendly offline page with a retry button.

**Strategy rationale:**
- **CacheFirst** for static assets (logos, icons, fonts, species images) — these change rarely and should load instantly.
- **StaleWhileRevalidate** for map tiles and CSS — serve cached version immediately, update in background.
- **NetworkFirst** for API routes and page navigations — prefer fresh data, fall back to cache when offline.

### Sync Queue Architecture

**Module:** `src/offline/syncQueue.ts`

The sync queue manages offline write operations that need to be synced to PocketBase when the device comes back online.

```
User writes data offline
    → Data saved to IndexedDB store (trips, expeditionLogs, photos, communityDrafts)
    → SyncQueueItem created with status 'pending'
    → When online: dequeue → markInProgress → PocketBase API call
    → Success: markDone(localId, serverId)
    → Failure: markFailed(localId), increment retryCount
```

**Queue item fields:**
- `localId` — Client-generated UUID
- `serverId` — PocketBase record ID (set after successful sync)
- `userId` — Owner of the operation
- `collection` — Target PocketBase collection
- `operation` — `create`, `update`, or `delete`
- `payload` — The data to sync
- `payloadHash` — SHA-256 hash for deduplication
- `syncStatus` — `pending` → `in-progress` → `done` or `failed`
- `retryCount` — Number of failed attempts

**Operations:**
- `enqueue(input)` — Add a new pending item
- `dequeue()` — Get the oldest pending item
- `markInProgress(localId)` — Transition to in-progress
- `markDone(localId, serverId?)` — Mark as synced
- `markFailed(localId)` — Mark as failed, increment retryCount
- `getPending()` — Get all pending items
- `getFailed()` — Get all failed items
- `clearDone()` — Remove completed items (housekeeping)
- `retryFailed(maxRetries)` — Reset failed items to pending (up to maxRetries)

**UI indicator:** `SyncStatusIndicator.tsx` displays one of three states: Offline, Syncing, or Up to date.

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config + PWA/Service Worker setup with Workbox caching rules |
| `tailwind.config.ts` | Brand color tokens, font families, custom utilities |
| `tsconfig.json` | TypeScript strict mode, path aliases (`@/*` → `./src/*`) |
| `vitest.config.ts` | Unit test config with path aliases |
| `playwright.config.ts` | E2E test config with mobile device profiles |
| `.eslintrc.json` | ESLint with next/core-web-vitals |
| `postcss.config.mjs` | PostCSS with TailwindCSS and Autoprefixer |
