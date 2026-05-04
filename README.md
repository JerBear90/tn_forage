# ForageFlow

ForageFlow is an offline-first, mobile-ready Progressive Web App for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee. It is a safe identification-support tool — not a consumption decision tool.

## Core Priorities

1. **Offline-first** — Field Guide, trips, logs, and maps work without internet
2. **Mobile-native** — PWA with bottom nav, large tap targets, iPhone Safari + Android Chrome
3. **Safety-first** — No "safe to eat" language; toxic lookalikes shown first; expert confirmation required
4. **Reliable field tools** — Map, trip planner, expedition log, and species identification
5. **Secure auth and membership** — SSO, Stripe webhooks, server-side role validation

## Safety Disclaimer

Mushroom and plant identification is for educational purposes only. Do not consume any wild mushroom or plant based solely on this app. Verify with a qualified expert before consuming and follow all local regulations.

---

## Feature Tree

### Field Guide (`/field-guide`)
- **Species List** — Searchable, filterable list of all mushrooms, plants, and trees
  - Category filter chips (All, Mushroom, Plant, Tree)
  - Regional filter (East, Middle, West Tennessee)
  - Advanced filters: Season (Spring/Summer/Fall/Winter), Edibility
  - Full-text search by common or scientific name
  - Virtual scrolling for large lists
- **Species Detail** (`/field-guide/[id]`) — Full detail for any species, plant, or tree
  - Image gallery with tap-to-enlarge lightbox
  - Season chart (12-month grid showing in-season months)
  - Foraging tips (contextual, season-aware)
  - Voice pronunciation for common and scientific names
  - Habitat, region, identification steps
  - **Tree Associations** — Linked to tree detail pages in the field guide
  - **Associated Species** (on trees) — Linked to mushroom/plant detail pages
  - Toxic lookalikes (always shown before edibility notes)
  - Non-toxic lookalikes
  - Edibility tab with safety notes
  - Spore print info (mushrooms only)
  - Bruising notes (mushrooms only)
  - Sources and last-updated date
  - Breadcrumb navigation back to Field Guide
- **Season Heatmap** — Collapsible multi-species seasonality grid
  - Species on Y-axis, months on X-axis
  - Months ordered starting from previous month (touch-scrollable)
  - Current month column highlighted
  - Category filter tabs (All, Mushroom, Plant, Tree)
  - Trees shown as year-round (🌳 icon in every month)
  - In-season cells use color + filled dot for accessibility
  - ARIA table roles for screen reader navigation
- **Lookalike Comparison** (`/field-guide/compare`) — Side-by-side 2–4 species
  - Species picker with search/filter
  - Comparison grid with key identification features
  - Toxic species visually highlighted
  - Breadcrumb navigation back to Field Guide
- **Spore Print Guide** (`/field-guide/spore-print`) — Step-by-step instructions
  - Color reference with visual swatches
  - Species-linked spore print expectations
  - Safety warning
  - Breadcrumb navigation back to Field Guide

### Mushroom Calendar (`/mushroom-calendar`)
- Monthly view of mushroom species in season
- **Current month shown first** — months ordered starting from current month
- Species image thumbnails with links to detail pages
- Monthly foraging tips
- Current month highlighted with visual indicator
- Safety disclaimer
- Breadcrumb navigation back to Field Guide

### Identification
- **Guided ID Wizard** (`/identify`) — Step-by-step manual identification
  - Multi-step form with progressive narrowing
  - Works offline
- **AI Photo Recognition** (`/identify/ai`) — Camera/gallery upload
  - Possible-match results only (never confirms edibility)
  - Requires internet connection

### Map (`/map`)
- Interactive Leaflet map of Tennessee
- Park markers with clustering
- Trail polylines
- Route polylines (dashed)
- Map/List view toggle
- Detail panels for parks, trails, and routes
- Mushroom species markers on map
- Find Me (geolocation)
- Cached tiles for offline viewing of previously browsed areas
- Map legend

### Trips (`/trips`)
- **Trip List** — Saved trips with search/filter and sync indicator
- **Create Trip** (`/trips/new`) — Park/trail/route/custom, date, notes, target species
- Offline save with background sync

### Expedition Log (`/expedition`)
- Quick log entry with photo capture and GPS
- Private/public toggle
- Offline-first with sync queue

### Community (`/community`)
- Sightings feed with comments
- Suggested IDs from other users
- Content flagging
- Location privacy (GPS fuzzing ~1 km offset)

### Profile (`/profile`)
- Edit name, email, avatar upload
- Theme settings (dark/light mode)
- Cached profile data for offline access

### Membership (`/membership`)
- Plan display (Free, Monthly, Yearly)
- Upgrade via Stripe Checkout
- Server-authoritative membership via Stripe webhooks

### Authentication
- **Login** (`/login`) — Email/password + SSO buttons
- **Signup** (`/signup`) — Email/password registration
- **SSO** — Google, Apple, Microsoft (redirect-based OAuth via PocketBase)
- **OAuth Callback** (`/auth/callback`) — Processes SSO redirect response

### Admin (`/admin`) — Super User only
- **Content Moderation** (`/admin/moderation`) — Flag review, community post management
- **Safety Notices** (`/admin/safety-notices`) — Create/edit safety notices

### PWA & Offline
- Service Worker with Workbox (generated by `@ducanh2912/next-pwa`)
- Background Sync for offline operations
- IndexedDB with 17 typed stores
- Cached app shell, species images, and map tiles
- Offline fallback page (`/~offline`)
- PWA install with splash screen and app icons
- Dark/light mode with system preference detection

---

## Architecture Overview

```
forageflow/
├── .github/workflows/     # CI pipeline (lint, typecheck, test, build, E2E)
├── .kiro/specs/           # Spec files (requirements, design, tasks)
├── docs/                  # Documentation (wiki, security, brand, stripe)
├── public/
│   ├── branding/          # SVG logos (logo.svg, logo-dark.svg, app-icon.svg)
│   ├── icons/             # PWA icons (192, 512, maskable, apple-touch)
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service Worker (generated by next-pwa)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin/         # Super User admin pages
│   │   ├── api/stripe/    # Stripe checkout + webhook API routes
│   │   ├── auth/callback/ # OAuth SSO callback
│   │   ├── community/     # Community sightings
│   │   ├── expedition/    # Expedition log
│   │   ├── field-guide/   # Field Guide list, detail, compare, spore-print
│   │   ├── identify/      # Guided ID Wizard + AI recognition
│   │   ├── login/         # Login page
│   │   ├── map/           # Leaflet map with parks/trails/routes
│   │   ├── membership/    # Membership plans + Stripe checkout
│   │   ├── mushroom-calendar/ # Monthly mushroom season calendar
│   │   ├── profile/       # Profile editing + settings
│   │   ├── signup/        # Signup page
│   │   ├── trips/         # Trip list + create trip
│   │   └── ~offline/      # Offline fallback page
│   ├── auth/              # Auth service, providers, role gates, SSO
│   ├── components/        # Shared UI components
│   ├── data/              # Seed data (species, parks, trails, routes)
│   ├── hooks/             # React hooks (useAuth, useSpecies, useTrips, etc.)
│   ├── map/               # Map components (ForageFlowMap, panels, list view)
│   ├── offline/           # IndexedDB wrapper (db.ts) + sync queue
│   ├── services/          # Business logic (scoring, privacy, membership, verification)
│   ├── styles/            # Global CSS
│   └── types/             # TypeScript type definitions
├── tests/
│   ├── e2e/               # Playwright E2E tests
│   └── unit/              # Vitest unit + integration tests
├── next.config.mjs        # Next.js + PWA configuration
├── vitest.config.ts       # Vitest configuration
├── playwright.config.ts   # Playwright configuration
├── tailwind.config.ts     # TailwindCSS with brand tokens
└── tsconfig.json          # TypeScript configuration
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS with brand color tokens |
| Map | Leaflet + react-leaflet + marker clustering |
| Offline Storage | IndexedDB via `idb` library |
| Service Worker | `@ducanh2912/next-pwa` with Workbox |
| Backend | PocketBase (auth, data, file storage) |
| Payments | Stripe Checkout + Webhooks |
| SSO | Google, Apple, Microsoft (redirect-based OAuth via PocketBase) |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| CI | GitHub Actions |

### Key Design Decisions

- **Offline-first**: All core field tools (Field Guide, trips, logs, maps) work without internet. Data is stored in IndexedDB with 17 typed stores. Service Worker caches app shell, species images, and map tiles.
- **Safety-first**: AI and manual identification never confirm edibility. Toxic lookalikes are always shown before edible notes. Forbidden phrases ("safe to eat", "confirmed edible", "AI verified") are enforced throughout.
- **Server-authoritative membership**: Stripe webhooks are the source of truth for paid access. The frontend displays cached membership but cannot grant it.
- **Redirect-based SSO**: OAuth uses redirect flow (not popup) for PWA/mobile reliability.
- **Location privacy**: Public community posts use GPS fuzzing (~1 km offset) to protect user locations.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- PocketBase (for auth, data sync, and file storage)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd forageflow

# Install dependencies
npm install

# Copy environment files
cp .env.example .env.local
```

### Environment Configuration

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_APP_NAME=ForageFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server-only (never exposed to browser):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

For SSO configuration, see `.env.sso.example` and `docs/security/sso-provider-setup.md`.

### PocketBase Setup

```bash
# Download PocketBase from https://pocketbase.io/docs/
# Start PocketBase
./pocketbase serve

# Access admin UI at http://127.0.0.1:8090/_/
# Create a "users" collection with fields:
#   - role (text): guest, free, member, super_user
#   - membershipPlan (text): free, monthly, yearly, lifetime, admin
#   - membershipStatus (text): inactive, active, trialing, past_due, canceled
#   - stripeCustomerId (text)
#   - subscriptionId (text)
#   - currentPeriodEnd (date)
#   - membershipLastVerifiedAt (date)
```

### Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

### Running Tests

```bash
# Unit + integration tests
npm test

# Watch mode
npm run test:watch

# E2E tests (requires running dev server)
npx playwright test

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable production-ready branch |
| `spec/*` | Spec and documentation updates |
| `feature/*` | Feature implementation |
| `fix/*` | Bug fixes |
| `security/*` | Authentication and security changes |

---

## Documentation

| Document | Location |
|----------|----------|
| Requirements | `.kiro/specs/forageflow/requirements.md` |
| Design | `.kiro/specs/forageflow/design.md` |
| Tasks | `.kiro/specs/forageflow/tasks.md` |
| Architecture Wiki | `docs/wiki/architecture.md` |
| Offline System | `docs/wiki/offline-system.md` |
| Map System | `docs/wiki/map-system.md` |
| Security & SSO | `docs/wiki/security-sso.md` |
| Auth Threat Model | `docs/security/auth-threat-model.md` |
| SSO Provider Setup | `docs/security/sso-provider-setup.md` |
| Membership | `docs/wiki/membership.md` |
| Stripe Spec | `docs/stripe/membership-stripe-spec.md` |
| Brand Guide | `docs/brand/brand-guide.md` |
| AI Safety | `docs/wiki/ai-safety.md` |
| Testing | `docs/wiki/testing.md` |
| Sitemap | `docs/sitemap.md` |
| Developer Setup | `docs/wiki/getting-started.md` |

---

## Kiro Spec Location

```
.kiro/specs/forageflow/
  requirements.md
  design.md
  tasks.md
  security-sso-requirements.md
  security-sso-design.md
  security-sso-tasks.md
```
