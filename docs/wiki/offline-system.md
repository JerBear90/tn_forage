# ForageFlow Offline System

## Overview

ForageFlow is offline-first. Core field tools work without internet after the initial visit. The offline system uses IndexedDB for structured data and a Service Worker for app shell, images, and map tile caching.

## IndexedDB Database

**Module**: `src/offline/db.ts`
**Library**: `idb` (typed IndexedDB wrapper)
**Database name**: `forageflow`
**Version**: 1

### Stores (17 total)

| Store | Key | Purpose |
|-------|-----|---------|
| `species` | `id` | Mushroom species data (indexed by category, name, edibility, lastUpdated) |
| `plants` | `id` | Plant species data |
| `trees` | `id` | Tree species data |
| `parks` | `id` | Tennessee State Parks (indexed by name, region) |
| `trails` | `id` | Trail data (indexed by parkId, name, difficulty) |
| `routes` | `id` | Route data (indexed by parkId, name, difficulty) |
| `trips` | `id` | User trips (indexed by userId, date, syncStatus) |
| `expeditionLogs` | `id` | Expedition log entries (indexed by userId, tripId, syncStatus) |
| `photos` | `id` | Expedition photos as blobs (indexed by expeditionLogId, syncStatus) |
| `userProfileLocal` | `id` | Cached user profile for offline display |
| `membershipLocal` | `id` | Cached membership status (indexed by userId) |
| `authMetaLocal` | `id` | Auth state metadata for offline session restore |
| `syncQueue` | `localId` | Pending sync operations (indexed by userId, collection, syncStatus) |
| `settings` | `id` | App settings (theme preference, etc.) |
| `cachedMapRegions` | `id` | Metadata for cached map tile regions |
| `communityDrafts` | `id` | Offline community post drafts |
| `communityFlags` | `id` | Content flags for moderation |

### CRUD Helpers

The `db.ts` module exports generic typed helpers:
- `getRecord(storeName, key)` — Get a single record
- `getAllRecords(storeName)` — Get all records from a store
- `putRecord(storeName, value)` — Insert or update a record
- `deleteRecord(storeName, key)` — Delete a record
- `clearStore(storeName)` — Clear all records
- `countRecords(storeName)` — Count records

## Sync Queue

**Module**: `src/offline/syncQueue.ts`

The sync queue manages offline write operations that need to be synced to PocketBase when the device comes back online.

### Queue Item Schema

```typescript
interface SyncQueueItem {
  localId: string;          // crypto.randomUUID()
  serverId?: string;        // PocketBase record ID (set after sync)
  userId: string;
  collection: string;       // PocketBase collection name
  operation: SyncOperation; // 'create' | 'update' | 'delete'
  payload: unknown;
  payloadHash: string;      // SHA-256 for deduplication
  createdAt: string;        // ISO 8601
  updatedAt: string;
  syncStatus: SyncQueueStatus; // 'pending' | 'in-progress' | 'done' | 'failed'
  retryCount: number;
  clientVersion: number;
}
```

### Operations

- `enqueue(input)` — Add a new item (auto-generates localId, timestamps, hash)
- `dequeue()` — Get the oldest pending item
- `markInProgress(localId)` — Transition to in-progress
- `markDone(localId, serverId?)` — Mark as synced
- `markFailed(localId)` — Mark as failed, increment retryCount
- `getPending()` — Get all pending items
- `getFailed()` — Get all failed items
- `clearDone()` — Remove completed items (housekeeping)
- `retryFailed(maxRetries)` — Reset failed items to pending (up to maxRetries)

## Service Worker

**Configuration**: `next.config.mjs` (via `@ducanh2912/next-pwa`)

### Cache Strategy

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

### Offline Fallback

When a navigation request fails both network and cache, the Service Worker serves `/~offline` — a friendly offline page with a retry button.

## What Works Offline

| Feature | Offline Support |
|---------|----------------|
| Field Guide (list + detail) | Full — reads from IndexedDB |
| Lookalike Comparisons | Full — reads from IndexedDB |
| Spore Print Guide | Full — static content |
| Guided ID Wizard | Full — uses local species data |
| Map (previously viewed areas) | Partial — cached tiles + IndexedDB markers |
| Trip creation | Full — saves to IndexedDB |
| Trip list | Full — reads from IndexedDB |
| Expedition log | Full — saves to IndexedDB |
| Photo capture | Full — saves blobs to IndexedDB |
| Profile display | Full — cached in IndexedDB |
| Auth (previously logged in) | Full — restores from IndexedDB |

## What Requires Internet

| Feature | Reason |
|---------|--------|
| First-time login/signup | PocketBase authentication |
| SSO (Google/Apple/Microsoft) | OAuth redirect flow |
| AI photo recognition | Server-side model inference |
| Stripe checkout | Payment processing |
| Community feed (live) | Real-time content |
| Admin actions | Server-side validation |
| Data sync | PocketBase API calls |

## Sync Status UI

**Component**: `src/components/SyncStatusIndicator.tsx`

Displays one of three states in the app shell:
- **Offline** — Device is disconnected
- **Syncing** — Processing queued operations
- **Up to date** — All changes synced
