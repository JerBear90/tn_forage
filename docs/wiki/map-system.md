# ForageFlow Map System

## Overview

The map system uses Leaflet (via `react-leaflet`) to display Tennessee State Parks, trails, routes, saved trips, and expedition logs. Map tiles are cached by the Service Worker for offline viewing of previously browsed areas.

## Components

### ForageFlowMap (`src/map/ForageFlowMap.tsx`)
Main map component rendered on `/map`. Features:
- Leaflet map centered on Tennessee
- Park, trail, and route marker layers
- Marker clustering via `react-leaflet-cluster` for performance
- Find Me button (GPS request with manual/cached fallback)
- Clickable markers that open detail panels

### MapDetailPanel (`src/map/MapDetailPanel.tsx`)
Persistent detail panel that opens when a marker is clicked:
- Shows park/trail/route information
- Stays open until the user explicitly closes it
- Does not disappear on map interaction
- Includes images, amenities, and navigation links

### MapListView (`src/map/MapListView.tsx`)
Thumbnail list view alongside the map:
- Parks and trails with images
- Clickable items that center the map on the selected location
- Works as an alternative to map-only browsing

### MapPageClient (`src/app/map/MapPageClient.tsx`)
Client component wrapper for the map page (Leaflet requires client-side rendering).

## Data Sources

Map data is stored in IndexedDB and seeded from:
- `src/data/parksSeed.ts` — Tennessee State Parks
- `src/data/trailsSeed.ts` — Trail data with coordinates
- `src/data/routesSeed.ts` — Route data with coordinates

### Park Schema
```typescript
interface Park {
  id: string;
  name: string;
  region: string;
  coordinates: { lat: number; lng: number };
  image?: string;
  amenities: string[];
  trails: string[];
  hours?: string;
  fees?: string;
  foragingRules: string;
  lastUpdated: string;
}
```

### Trail Schema
```typescript
interface Trail {
  id: string;
  parkId: string;
  name: string;
  distance: number;
  difficulty: string;
  coordinates: Array<{ lat: number; lng: number }>;
  elevationProfile?: number[];
  likelyTrees: string[];
  likelySpecies: string[];
  images: string[];
  lastUpdated: string;
}
```

## GPS and Location

### Find Me Button
- Single button — no duplicate GPS controls
- Requests `navigator.geolocation.getCurrentPosition()`
- Compatible with iPhone Safari and Android Chrome
- Falls back to manual location entry if GPS is denied
- Falls back to last cached location if both GPS and manual fail

### Hook: `useGeolocation` (`src/hooks/useGeolocation.ts`)
Manages GPS state:
- `position` — Current coordinates
- `error` — Geolocation error message
- `loading` — Whether a GPS request is in progress
- `requestPosition()` — Trigger a new GPS request

## Map Tile Caching

The Service Worker caches map tiles using StaleWhileRevalidate:

| Provider | Cache Name | Max Entries | TTL |
|----------|-----------|-------------|-----|
| OpenStreetMap | `map-tiles-osm` | 2000 | 30 days |
| Carto, Stadia, Thunderforest, MapTiler | `map-tiles-cdn` | 2000 | 30 days |

Previously viewed map areas are available offline. Tiles are served from cache instantly while the Service Worker fetches updates in the background.

## Marker Clustering

Uses `react-leaflet-cluster` to group nearby markers at lower zoom levels. This prevents performance issues when many parks/trails are visible simultaneously.

## Foraging Rules

Every park includes a `foragingRules` field. The default fallback message is:

> "Verify local regulations before collecting. Identification only unless permitted."

No park entry implies that foraging is allowed unless explicitly verified.
