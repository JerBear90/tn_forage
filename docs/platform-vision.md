# ForageWise — Platform Vision & Architecture

## Identity

ForageWise is a next-generation offline-first AI platform for field exploration, species identification, and foraging intelligence. It combines the best of iNaturalist, AllTrails, Gaia GPS, Merlin Bird ID, PlantNet, Mushroom Observer, Pokémon GO exploration mechanics, and ArcGIS field collection into one cohesive mobile-first system.

## Core Principle

**Offline functionality is not an enhancement layer. It is the foundation.**

All critical functionality operates without internet, cellular service, cloud APIs, online authentication, or remote AI inference. The platform remains fully functional in forests, mountains, wilderness, remote trails, disaster zones, and low-signal regions.

Cloud infrastructure only enhances: synchronization, community validation, backups, social systems, large-scale analytics, and advanced cloud AI.

---

## Offline-First Architecture Status

### Mandatory Offline Systems — Implementation Status

| System | Status | Implementation |
|--------|--------|---------------|
| AI identification | ✅ Built | Guided ID Wizard with local scoring (`identifyScoring.ts`). Cloud AI queued when offline. |
| GPS tracking | ✅ Built | `useGeolocation` hook with cached fallback in IndexedDB |
| Map rendering | ✅ Built | Leaflet with downloaded tile regions (`useOfflineMaps`) |
| Route recording | ✅ Built | Trip planning saves to IndexedDB, syncs later |
| Waypoint creation | ✅ Built | `PrivateMapPins` — drop pins at GPS location, stored locally |
| Species search | ✅ Built | Full-text search across IndexedDB species/plants/trees stores |
| Toxicity warnings | ✅ Built | Toxic lookalikes always shown first, `SurvivalToolkit` |
| Local observations | ✅ Built | `ObservationForm` saves to IndexedDB with full metadata |
| Image capture | ✅ Built | `QuickCapture` — one-tap photo + GPS + timestamp |
| Environmental references | ✅ Built | Season charts, foraging conditions, habitat data |
| Journals and notes | ✅ Built | Expedition logs, trip notes, habitat notes |
| Cached weather intelligence | ✅ Built | `useWeatherTemp` caches for 30min, `WeatherPanel` |
| Saved field guides | ✅ Built | All 30+ species seeded to IndexedDB on first load |

### Local-First Data Rules — Implementation

| Rule | Status | How |
|------|--------|-----|
| Save locally first | ✅ | All writes go to IndexedDB before network |
| Queue for sync later | ✅ | `syncQueue.ts` — enqueue, dequeue, markDone, markFailed, retryFailed |
| Continue during connection loss | ✅ | `useOnlineStatus` hook, graceful degradation everywhere |

---

## Platform Differentiators vs Competitors

| Feature | iNaturalist | AllTrails | ForageWise |
|---------|-------------|-----------|-----------|
| Offline species ID | ❌ | ❌ | ✅ Local scoring + queued cloud AI |
| Offline maps | ❌ | Paid feature | ✅ Free download by region |
| One-tap capture | ❌ | ❌ | ✅ QuickCapture (photo+GPS+time) |
| Private map pins | ❌ | ❌ | ✅ Secret spots, never shared |
| Foraging conditions | ❌ | ❌ | ✅ Weather-based scoring per park |
| Survival toolkit | ❌ | ❌ | ✅ Toxic species, water indicators, emergency GPS |
| AI confidence visual | ❌ | N/A | ✅ Colored bar + safety messaging |
| Research grade voting | ✅ | ❌ | ✅ 3+ agreements = Research Grade |
| Guided ID wizard | ❌ | N/A | ✅ Step-by-step with scoring |
| Trip planning + species | ❌ | Basic | ✅ Park → trail → likely species |
| PWA (no app store needed) | ❌ | ❌ | ✅ Install from browser |
| Community ID requests | ✅ | ❌ | ✅ "ID This For Me" |
| Gamification | ❌ | Badges | ✅ Challenges, life list, streaks |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│  Next.js 14 App Router · React 18 · TailwindCSS · PWA       │
│  Mobile-first · Touch-optimized · Dark mode · Accessible     │
├─────────────────────────────────────────────────────────────┤
│                    FEATURE LAYER                              │
│  Field Guide · Map · Trips · Identify · Community · Profile  │
│  Observations · Challenges · Calendar · Forecast · Journal   │
│  QuickCapture · PrivateMapPins · SurvivalToolkit             │
├─────────────────────────────────────────────────────────────┤
│                    INTELLIGENCE LAYER                         │
│  AI Confidence Visual · Foraging Conditions · Seasonality    │
│  iNaturalist Integration · Weather Intelligence              │
│  Guided ID Wizard · Species Matching · Habitat Scoring       │
├─────────────────────────────────────────────────────────────┤
│                    OFFLINE DATA LAYER (PRIMARY)               │
│  IndexedDB (42 stores) · Service Worker · Cache API          │
│  Sync Queue · Local-first writes · Conflict resolution       │
├─────────────────────────────────────────────────────────────┤
│                    CLOUD SYNC LAYER (SECONDARY)               │
│  PocketBase · Stripe · OAuth · Push Notifications            │
│  Community validation · Backup · Analytics · Cloud AI         │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge AI Strategy

### Current (Built)
- **Local scoring**: Guided ID Wizard scores species matches locally using feature comparison
- **Queued cloud AI**: When offline, AI requests are saved and processed when back online
- **Cached results**: Previous AI identifications cached in IndexedDB

### Future (Planned)
- **On-device TensorFlow.js model**: Lightweight mushroom classifier (~5MB) runs in browser
- **Progressive enhancement**: Local model gives instant result, cloud model refines
- **Confidence fusion**: Combine local model + cloud model + community votes

---

## GPS-Native Discovery

| Feature | Implementation |
|---------|---------------|
| Auto-capture coordinates | Every observation, pin, and log includes GPS |
| Location-based species | NearbyNow shows what's in season at your location |
| Park proximity | Map shows nearest parks with foraging conditions |
| Trail GPS polylines | Full trail routes rendered on Leaflet |
| Private waypoints | PrivateMapPins — personal secret spots |
| Emergency location sharing | SurvivalToolkit — text GPS coords via SMS |
| Offline coordinate display | Works without internet (GPS is satellite-based) |

---

## Community Verification System

```
Observation submitted
    ↓
Quality: "Needs ID" (has photo + GPS)
    ↓
Community members suggest species IDs
    ↓
Other users Agree or Disagree
    ↓
3+ agreements on same species
    ↓
Quality: "Research Grade" ✓
```

**Safety rule**: Research Grade does NOT mean safe to consume. Expert verification always required for edibility.

---

## Foraging-Specific Workflows

1. **Plan** → Pick park → See trails → View likely species → Check weather
2. **Capture** → QuickCapture (one tap) → Auto GPS + time → ID later
3. **Identify** → Guided Wizard OR AI photo → Confidence visual → Lookalike check
4. **Log** → Expedition log → Species + location + habitat + photos
5. **Share** → Community observation → Get community IDs → Research Grade
6. **Track** → Life list → Finds timeline → Private pins → Seasonal patterns

---

## File Structure (Key Components)

```
src/
├── components/
│   ├── QuickCapture.tsx          — One-tap field capture
│   ├── AIConfidenceVisual.tsx    — Honest confidence display
│   ├── PrivateMapPins.tsx        — Secret personal spots
│   ├── SurvivalToolkit.tsx       — Emergency reference
│   ├── NearbyNow.tsx             — Location-based species
│   ├── LifeList.tsx              — Species counter
│   ├── INaturalistSection.tsx    — Community observation data
│   ├── WeatherPanel.tsx          — Live conditions + online features
│   ├── DownloadMapButton.tsx     — Offline map tiles
│   ├── GuidedIntro.tsx           — New user onboarding
│   ├── MonetizationGate.tsx      — Premium feature gating
│   ├── OnlineHint.tsx            — Subtle offline messaging
│   ├── observations/
│   │   ├── ObservationForm.tsx   — Full observation submission
│   │   └── ObservationCard.tsx   — Display with voting
│   └── community/
│       └── IdRequest.tsx         — "ID This For Me"
├── services/
│   ├── iNaturalistService.ts     — Community data integration
│   ├── usageTracker.ts           — Feature usage analytics
│   └── missingImageReporter.ts   — Image gap tracking
├── hooks/
│   ├── useGeolocation.ts         — GPS with offline fallback
│   ├── useOfflineMaps.ts         — Tile download management
│   ├── useINaturalist.ts         — Species observation data
│   └── useOnlineStatus.ts        — Connection detection
├── offline/
│   ├── db.ts                     — IndexedDB (42 stores)
│   └── syncQueue.ts              — Offline write queue
└── types/
    └── observations.ts           — Biodiversity observation model
```

---

## What This Is NOT

- This is NOT a social media app that happens to have nature features
- This is NOT a cloud-first app with an offline mode bolted on
- This is NOT a generic nature identification tool
- This is NOT a replacement for expert mycological knowledge

## What This IS

- A **field-first tool** built for people who are actually in the woods
- An **offline-native platform** that treats connectivity as optional
- A **foraging-specific system** with workflows designed for harvesters
- A **safety-conscious application** that never claims certainty about edibility
- A **community-enhanced tool** where cloud features improve but never gate core functionality
