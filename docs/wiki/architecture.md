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
├─────────────────────────────────────────────────┤
│               React Hooks Layer                   │
│  useAuth · useSpecies · useTrips · useMapData    │
│  useGeolocation · useOnlineStatus · useSyncStatus│
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
- `db.ts` — IndexedDB wrapper with 17 typed stores, generic CRUD helpers
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
- Seed data for species, plants, trees, parks, trails, and routes
- `seedDatabase.ts` — Seeds IndexedDB on first load

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
