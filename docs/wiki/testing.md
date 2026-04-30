# ForageFlow Testing

## Overview

ForageFlow uses a multi-layer testing strategy covering unit tests, integration tests, E2E tests, offline/PWA tests, mobile viewport tests, and accessibility tests.

## Test Stack

| Tool | Purpose | Config |
|------|---------|--------|
| Vitest | Unit + integration tests | `vitest.config.ts` |
| Playwright | E2E + mobile + accessibility + offline tests | `playwright.config.ts` |
| fake-indexeddb | IndexedDB mock for unit tests | Dev dependency |

## Running Tests

```bash
# Unit + integration tests
npm test

# Watch mode
npm run test:watch

# E2E tests (starts dev server automatically)
npx playwright test

# E2E with UI mode
npx playwright test --ui

# Single browser
npx playwright test --project=chromium

# Specific test file
npx playwright test tests/e2e/field-guide.spec.ts
```

## Unit Tests (`tests/unit/`)

30+ unit test files covering all major modules:

### Auth & Security
| File | Tests |
|------|-------|
| `authService.test.ts` | Login, signup, logout, SSO, session restore, offline state |
| `useAuth.test.ts` | Auth hook state management |
| `roleHierarchy.test.ts` | Role comparison (guest < free < member < super_user) |
| `superUserGate.test.ts` | Super User access restriction |
| `oauthCallback.test.ts` | SSO callback processing |
| `loginPage.test.ts` | Login form rendering and validation |
| `signupPage.test.ts` | Signup form rendering and validation |

### Membership & Stripe
| File | Tests |
|------|-------|
| `membershipGate.test.ts` | Plan-based access restriction |
| `stripeCheckout.test.ts` | Checkout session creation |
| `stripeWebhook.test.ts` | Webhook signature verification and event handling |

### Field Guide & Identification
| File | Tests |
|------|-------|
| `fieldGuideFilters.test.ts` | Category, season, habitat filtering |
| `useSpecies.test.ts` | Species data hook |
| `useSpeciesDetail.test.ts` | Species detail loading |
| `identifyScoring.test.ts` | Guided ID Wizard scoring logic |
| `lookalikeVerificationChecklist.test.ts` | Verification checklist enforcement |
| `compareData.test.ts` | Lookalike comparison data |
| `useCompare.test.ts` | Comparison hook |
| `imageLightbox.test.ts` | Image enlarge/lightbox |

### Map & Location
| File | Tests |
|------|-------|
| `useMapData.test.ts` | Map data loading from IndexedDB |
| `useGeolocation.test.ts` | GPS request and fallback |
| `mapDetailPanel.test.ts` | Marker detail panel |
| `mapListView.test.ts` | Thumbnail list view |
| `locationPrivacy.test.ts` | GPS coordinate fuzzing |

### Trips & Expedition
| File | Tests |
|------|-------|
| `createTrip.test.ts` | Trip creation flow |
| `useTrips.test.ts` | Trips hook |
| `expeditionLog.test.ts` | Expedition log creation |

### Offline & Sync
| File | Tests |
|------|-------|
| `syncQueue.test.ts` | Enqueue, dequeue, status transitions, retry logic |
| `syncStatusIndicator.test.ts` | Sync status UI component |

### Profile
| File | Tests |
|------|-------|
| `profilePage.test.ts` | Profile editing and display |
| `useIdentifyWizard.test.ts` | Wizard step management |

## E2E Tests (`tests/e2e/`)

### Critical User Flows (`field-guide.spec.ts`)
- Field Guide navigation and species list
- Species detail view with safety language enforcement
- Trip creation flow
- Login page with SSO buttons

### Offline Functionality (`offline.spec.ts`)
- Field Guide works offline after initial visit
- Species list renders from IndexedDB while offline
- Trips save offline
- Expedition logs save offline
- Map shows cached tiles when offline
- Offline badge appears when disconnected

### Accessibility (`accessibility.spec.ts`)
- WCAG AA contrast (no white text on light backgrounds)
- Screen reader labels on navigation and form inputs
- Alt text on images
- Focus management in modals
- Visible focus indicators
- Keyboard navigation (Tab, Enter, Space, Escape)

### Mobile Viewport (`mobile.spec.ts`)
- iPhone Safari viewport rendering
- Android Chrome viewport rendering
- Bottom navigation visibility and positioning
- Large tap targets (minimum 44px)
- No horizontal scroll overflow
- Map controls at usable size on mobile
- Find Me button accessibility on mobile

## CI Pipeline (`.github/workflows/ci.yml`)

### Primary Job: `lint-typecheck-test-build`
Runs on every push and PR:
1. **Lint** — `npm run lint` (ESLint with next/core-web-vitals)
2. **Typecheck** — `npm run typecheck` (TypeScript strict mode)
3. **Unit tests** — `npm run test` (Vitest)
4. **Build** — `npm run build` (Next.js production build)

### Optional Job: `playwright-e2e`
Runs on push to `main` only (after primary job passes):
1. Install Playwright browsers (Chromium)
2. Build the app
3. Run Playwright E2E tests
4. Upload test report as artifact (14-day retention)
5. `continue-on-error: true` — E2E failures don't block the pipeline

## Core Regression Checklist

These scenarios should pass before any release:

1. App loads online
2. App loads offline after first visit
3. Field Guide works offline
4. Species detail works offline
5. Lookalike comparison works offline
6. Spore guide works offline
7. Find Me works with GPS allowed
8. GPS denied fallback works
9. Last cached location works
10. Map marker opens panel
11. Route panel persists until closed
12. Park details open reliably
13. Create trip from park/trail/route/custom
14. Add expedition log with photo
15. Save offline, sync online
16. Login with email/password
17. Logout
18. SSO works online
19. SSO disabled offline
20. Offline reopen after prior login
21. Protected routes work offline
22. Membership gate blocks unpaid users
23. Stripe webhook updates membership
24. Super User route blocked for normal users
25. AI online, queued/disabled offline
26. AI warning appears on results
27. Manual ID wizard shows only possible matches
28. No "safe to eat" appears anywhere
29. Dark mode and light mode work
30. Keyboard navigation works
31. Screen reader labels present

## Critical Test Devices

- iPhone Safari (primary mobile target)
- Android Chrome (primary mobile target)
- Desktop Chrome (development/testing)
- Installed PWA mode (both iOS and Android)
