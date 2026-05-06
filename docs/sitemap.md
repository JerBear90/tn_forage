# ForageWise Sitemap

All routes implemented in the Next.js App Router (`src/app/`).

## Route Map

```
/                              Home Page
│                              - Animated logo intro (skippable, shown once)
│                              - Quick action buttons (Find Me, Identify, Field Guide, Map, Create Trip)
│                              - Seasonal highlights, nearby suggestions
│                              - Offline badge, safety disclaimer
│
├── /field-guide               Field Guide — species list with search + filters
│   ├── /field-guide/[id]      Species Detail — full species info, safety language enforced
│   ├── /field-guide/compare   Lookalike Comparison — side-by-side 2-4 species
│   └── /field-guide/spore-print  Spore Print Guide — instructions + color reference
│
├── /identify                  Guided ID Wizard — step-by-step manual identification
│   └── /identify/ai           AI Photo Recognition — camera/gallery upload, possible-match results
│
├── /map                       Map — Leaflet with parks, trails, routes, Find Me, cached tiles
│                              - MapPageClient.tsx (client component)
│                              - Marker clustering, detail panels, list view
│
├── /trips                     Trips Page — list saved trips, search/filter, sync indicator
│   └── /trips/new             Create Trip — park/trail/route/custom, date, notes, target species
│
├── /expedition                Expedition Log — quick log, photo capture, GPS, private/public
│
├── /community                 Community — sightings, comments, suggested IDs, flagging
│
├── /profile                   Profile — edit name/email, avatar upload, settings
│                              - ProfileContent.tsx (client component)
│
├── /membership                Membership — plan display, upgrade via Stripe Checkout
│
├── /login                     Login — email/password + SSO buttons (Google, Apple, Microsoft)
├── /signup                    Signup — email/password registration
│
├── /auth/callback             OAuth Callback — processes SSO redirect response
│
├── /admin                     Admin Dashboard (Super User only)
│   ├── /admin/moderation      Content Moderation — flag review, community post management
│   └── /admin/safety-notices  Safety Notice Management — create/edit safety notices
│
├── /api/stripe/checkout       Stripe Checkout Session API (server-side)
├── /api/stripe/webhook        Stripe Webhook Handler (server-side, signature verified)
│
└── /~offline                  Offline Fallback — friendly message when navigating to uncached route
```

## Navigation Structure

### Bottom Navigation (5 tabs)
1. **Home** → `/`
2. **Identify** → `/identify`
3. **Field Guide** → `/field-guide`
4. **Map** → `/map`
5. **Trips** → `/trips`

### Protected Routes
- `/profile` — requires authentication (online or offline)
- `/admin/*` — requires `super_user` role
- `/membership` — visible to all, upgrade actions require auth
- `/trips/new` — requires authentication
- `/expedition` — requires authentication

### Offline-Available Routes
After initial visit, these routes work offline via Service Worker + IndexedDB:
- `/` (Home)
- `/field-guide` and `/field-guide/[id]`
- `/field-guide/compare`
- `/field-guide/spore-print`
- `/identify` (manual wizard only; AI requires connection)
- `/map` (cached tiles and marker data)
- `/trips` and `/trips/new`
- `/expedition`
- `/profile` (cached profile data)
- `/~offline` (fallback for uncached routes)

### Online-Only Routes
- `/login` and `/signup` (first-time auth requires internet)
- `/auth/callback` (OAuth redirect processing)
- `/api/stripe/*` (payment processing)
- `/community` (live community feed)
- `/admin/*` (admin actions require server validation)
