# ForageFlow Implementation Tasks

## Phase 0: Spec Validation
- [x] 0. Spec Validation — Read all spec and steering files, identify contradictions, confirm architecture and task order

---

## Phase 1: Project Foundation
- [x] 1. Project Foundation — Initialize app, routing, shell, and mobile-first layout
  - [x] 1.1 Initialize Next.js app with TypeScript and configure project structure per design.md
  - [x] 1.2 Add TailwindCSS with ForageFlow brand color tokens and font setup (Inter, Poppins, Nunito Sans)
  - [x] 1.3 Add PWA support — next-pwa or equivalent, manifest.json, app icons, splash screen
  - [x] 1.4 Add base routing — app directory structure with pages for Home, Field Guide, Identify, Map, Trips, Profile, Login, Signup
  - [x] 1.5 Add bottom navigation — mobile-first, large tap targets, accessible labels, 5 tabs (Home, Identify, Field Guide, Map, Trips/Profile)
  - [x] 1.6 Add theme provider — dark/light mode support with TailwindCSS, persist preference
  - [x] 1.7 Add app shell layout — header, bottom nav, main content area, offline badge slot, safety disclaimer slot
  - [x] 1.8 Add offline badge component — displays "Offline Mode" when navigator.onLine is false
  - [x] 1.9 Add global safety disclaimer — banner on first use, dismissible, cached after dismissal

---

## Phase 2: Branding
- [x] 2. Branding — Logo assets, brand colors, fonts, intro animation
  - [x] 2.1 Integrate ForageFlow SVG logo assets (logo.svg, logo-dark.svg, app-icon.svg) into app shell and splash
  - [x] 2.2 Configure brand color palette in Tailwind config — teal #0F766E, forest #14532D, moss #4D7C0F, earth #7C4A24, sand #F5F0DF, charcoal #1F2937
  - [x] 2.3 Add font loading — Inter primary, Poppins headings, Nunito Sans fallback via next/font or CSS
  - [x] 2.4 Add PWA splash screen and icon assets for iOS and Android
  - [x] 2.5 Add animated logo intro — 2-3 seconds, skippable, shown once then cached in localStorage

---

## Phase 3: Offline Data Layer
- [ ] 3. Offline Data Layer — IndexedDB, Service Worker, cache strategy, sync queue
  - [ ] 3.1 Add IndexedDB wrapper (idb or Dexie) with stores: species, plants, trees, parks, trails, routes, trips, expeditionLogs, photos, userProfileLocal, membershipLocal, authMetaLocal, syncQueue, settings, cachedMapRegions, communityDrafts
  - [ ] 3.2 Add Service Worker — cache app shell, static assets, logos, core CSS/JS, offline fallback page
  - [ ] 3.3 Add cache strategy — network-first for API, cache-first for static assets and Field Guide images, stale-while-revalidate for map tiles
  - [ ] 3.4 Add sync queue module — localId, serverId, userId, collection, operation, payload, payloadHash, timestamps, syncStatus, retryCount, clientVersion
  - [ ] 3.5 Add offline fallback page — friendly message when navigating to uncached route while offline
  - [ ] 3.6 Add sync status UI component — Offline / Syncing / Up to date indicator in app shell

---

## Phase 4: Field Guide
- [ ] 4. Field Guide — Species data, list, detail, filters, offline support
  - [ ] 4.1 Add species TypeScript data model matching design.md Species schema
  - [ ] 4.2 Add local species seed data — Tennessee mushrooms, plants, trees with all required fields (commonName, scientificName, category, images, habitat, treeAssociations, season, region, identificationSteps, lookalikes, toxicLookalikes, sporePrint, bruisingNotes, edibilityLabel, safetyNotes, sources, lastUpdated)
  - [ ] 4.3 Add Field Guide list page — searchable, filterable by category/season/habitat, reads from IndexedDB
  - [ ] 4.4 Add species detail page — all fields rendered, toxic lookalikes shown before edible notes, safety language enforced
  - [ ] 4.5 Add species images — placeholder system with offline-cached images from IndexedDB/Service Worker
  - [ ] 4.6 Add Field Guide filters — category, season, habitat, tree association, edibility label
  - [ ] 4.7 Add Last Updated display on species entries

---

## Phase 5: Lookalike + Spore Print
- [ ] 5. Lookalike Comparisons + Spore Print Guide
  - [ ] 5.1 Add comparison system — multi-select 2-4 species, side-by-side layout with cap, underside, stem, habitat, tree, season, edibility
  - [ ] 5.2 Add image enlarge — tap to expand species images on mobile
  - [ ] 5.3 Enforce toxic lookalikes first ordering in comparison results
  - [ ] 5.4 Add Spore Print Guide — step-by-step instructions, color reference, species-linked expectations, safety warning

---

## Phase 6: Guided ID Wizard
- [ ] 6. Guided ID Wizard — Step-by-step manual identification
  - [ ] 6.1 Build step-by-step wizard UI — underside type, growth location, nearby tree, cap color, cap shape, stem features, bruising, season, moisture, optional GPS
  - [ ] 6.2 Add scoring logic — match against local species data, return Strong possible match / Possible match / Low confidence / Insufficient information
  - [ ] 6.3 Add verification checklist — force lookalike review before showing edible notes
  - [ ] 6.4 Add result labels — never show Confirmed / Safe to eat / Definitely edible

---

## Phase 7: Map
- [ ] 7. Map System — Leaflet, parks, trails, routes, Find Me, offline tiles
  - [ ] 7.1 Add Leaflet map component with TN state parks, trails, routes layers
  - [ ] 7.2 Add parks data model and seed — Tennessee State Parks with name, region, coordinates, amenities, trails, hours, fees, foragingRules
  - [ ] 7.3 Add trails/routes data model and seed — name, parkId, distance, difficulty, coordinates, elevation, likelyTrees, likelySpecies
  - [ ] 7.4 Add Find Me button — single GPS button, iPhone Safari + Android Chrome compatible, manual fallback, cached location fallback
  - [ ] 7.5 Add marker detail panels — clickable markers, persistent panels until user closes, route panels stay open
  - [ ] 7.6 Add thumbnail list view — parks/trails with images alongside map
  - [ ] 7.7 Add map tile caching — cache previously viewed tile regions for offline use
  - [ ] 7.8 Add marker clustering for performance

---

## Phase 8: Trips + Expedition
- [ ] 8. Trips + Expedition Log — Create, list, log, photo capture, offline-first
  - [ ] 8.1 Add Create Trip flow — select park/trail/route/custom location, add date, notes, target species, companions, safety notes
  - [ ] 8.2 Add Trips Page — list saved trips, search/filter, trip status, edit/delete, sync indicator
  - [ ] 8.3 Add Expedition Log — quick log mode, photo capture, gallery upload, caption, date/time, GPS/manual location, species guess, habitat notes, tree nearby, private/public, sync status
  - [ ] 8.4 Add camera/gallery upload — save photos locally to IndexedDB first
  - [ ] 8.5 Add offline-first save — all trips and logs save to IndexedDB, sync to PocketBase when online

---

## Phase 9: Auth + SSO
- [ ] 9. Authentication + SSO — Email/password, Google/Apple/Microsoft SSO, offline session
  - [ ] 9.1 Add auth service (src/auth/authService.ts) — login, signup, logout, SSO start, SSO callback, session restore, online/offline state machine
  - [ ] 9.2 Add AuthProvider + useAuth hook — expose user, role, membership, authState, isOffline, login, signup, logout, startSSO, refreshSession
  - [ ] 9.3 Add protected routes (ProtectedRoute.tsx) + role gates (RoleGate.tsx) — offline-aware, allow cached field access
  - [ ] 9.4 Add email/password auth with PocketBase
  - [ ] 9.5 Add Google/Apple/Microsoft SSO redirect flow + OAuth callback route
  - [ ] 9.6 Add offline session restore — IndexedDB profile with userId, displayName, role, membershipPlan, membershipStatus, offlineAccessAllowed
  - [ ] 9.7 Add login/signup pages with SSO buttons (disabled when offline)

---

## Phase 10: Profile
- [ ] 10. Profile + Settings
  - [ ] 10.1 Add edit profile page — name, email, avatar upload (camera + gallery), crop/preview
  - [ ] 10.2 Add settings page — dark/light mode toggle, account delete request
  - [ ] 10.3 Add local profile cache — IndexedDB store for offline profile display

---

## Phase 11: Membership + Stripe
- [ ] 11. Membership + Stripe Integration
  - [ ] 11.1 Add membership UI — plan display, upgrade/downgrade options, status indicator
  - [ ] 11.2 Add Stripe checkout session API endpoint — server-side session creation, monthly/yearly plans
  - [ ] 11.3 Add Stripe webhook handler — checkout.session.completed, subscription.created/updated/deleted, invoice.payment_succeeded/failed
  - [ ] 11.4 Add membership gate component — restrict premium features based on role/plan
  - [ ] 11.5 Add offline cached membership display — show cached plan/status from IndexedDB

---

## Phase 12: Super User
- [ ] 12. Super User Tools
  - [ ] 12.1 Add Super User role gate — server-validated, block non-super users
  - [ ] 12.2 Add admin shell layout — dashboard, moderation, species editor, safety notice editor links
  - [ ] 12.3 Add content moderation structure — flag review, community post management
  - [ ] 12.4 Add safety notice management — create/edit safety notices for species

---

## Phase 13: AI Recognition
- [ ] 13. AI Photo Recognition
  - [ ] 13.1 Add camera/upload flow — capture or gallery, multi-photo recommended (top, underside, habitat, stem)
  - [ ] 13.2 Add queued offline behavior — save images locally with timestamp/location/notes, process when online
  - [ ] 13.3 Add possible-match results UI — top matches, confidence scores, similar species, toxic lookalikes, manual verification checklist
  - [ ] 13.4 Add AI/manual mismatch warning — "Uncertain result — verify manually" when AI and wizard disagree

---

## Phase 14: Community
- [ ] 14. Community Features
  - [ ] 14.1 Add sightings — user-submitted observations with species guess, photos, location
  - [ ] 14.2 Add comments and suggested IDs on sightings
  - [ ] 14.3 Add flagging — report unsafe/incorrect content
  - [ ] 14.4 Add private/public control — private-by-default, opt-in public sharing
  - [ ] 14.5 Add location privacy — fuzz GPS coordinates for public posts

---

## Phase 15: Testing
- [ ] 15. Testing Suite
  - [ ] 15.1 Add unit tests — components, hooks, utilities, data models
  - [ ] 15.2 Add integration tests — auth flows, sync queue, IndexedDB operations
  - [ ] 15.3 Add E2E tests — Playwright for critical user flows (Field Guide, Trip creation, Login)
  - [ ] 15.4 Add offline tests — verify Field Guide, trips, logs, maps work without network
  - [ ] 15.5 Add accessibility tests — WCAG AA compliance, contrast, screen reader labels, focus management
  - [ ] 15.6 Add auth/security tests — role gates, membership gates, Stripe webhook validation, Super User protection
  - [ ] 15.7 Add mobile viewport tests — iPhone Safari, Android Chrome layouts
  - [ ] 15.8 Add CI workflow — lint, typecheck, unit tests, build, optional Playwright E2E

---

## Phase 16: Documentation
- [ ] 16. Documentation
  - [ ] 16.1 Finalize README with setup instructions, architecture overview, branch strategy
  - [ ] 16.2 Update sitemap
  - [ ] 16.3 Finalize wiki pages — architecture, offline system, map system, membership, security/SSO, AI safety, testing
  - [ ] 16.4 Finalize brand guide
  - [ ] 16.5 Finalize security docs — auth threat model, SSO provider setup
  - [ ] 16.6 Finalize Stripe docs — membership spec, webhook handling
  - [ ] 16.7 Add developer setup guide with env configuration and PocketBase setup
