# What Is ForageFlow?

## Overview

ForageFlow is a mobile-first, offline-first Progressive Web App (PWA) for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee. It is designed as a field tool — something you open on your phone while standing in the woods, not a content site you browse from a couch.

The app provides a comprehensive Field Guide with species identification support, an interactive map of Tennessee state parks and trails, trip planning and expedition logging, community sightings, and foraging challenges. All core features work without an internet connection after the initial visit.

## Why "ForageFlow"?

The name combines two ideas:

- **Forage** — the act of searching for and gathering wild food, mushrooms, plants, and natural resources in the field.
- **Flow** — the state of focused, effortless engagement you experience when you are fully immersed in an activity outdoors.

ForageFlow is built to support that flow state. When you are on a trail identifying a mushroom or logging a sighting, the app stays out of your way. Offline-first means no loading spinners in areas with no signal. Mobile-first means the interface is designed for one-handed use on a phone screen. Safety-first means the app never tells you something is "safe to eat" — it provides information and always directs you to verify with a qualified expert.

## Core Principles

**Offline reliability** — Field Guide, trips, expedition logs, and maps work without internet after the first visit. Data is stored locally in IndexedDB and cached by a Service Worker.

**Mobile usability** — Every screen is designed for small viewports and touch interaction. Tap targets meet the 44x44px minimum. Navigation is via a fixed bottom bar.

**Safety first** — ForageFlow never uses language like "safe to eat", "definitely edible", "confirmed edible", or "AI verified." Toxic lookalikes are always shown before any edibility discussion. The app is an identification aid, not a substitute for expert verification.

**Real Tennessee data** — Park, trail, and tree data is sourced from Tennessee government websites and university extension resources. Each record includes a `sourceUrl` linking to the original source. Fields without verified data are left empty rather than fabricated.

## Key Features

- **Field Guide** — Browse mushrooms, plants, and trees with images, descriptions, seasonal info, and regional filtering (East TN, Middle TN, West TN).
- **Map** — Interactive Leaflet map showing all Tennessee state parks, trails, and routes with detail panels and a list view alternative.
- **Trips** — Plan and log foraging trips with location, date, and notes. All data saved locally.
- **Expedition Log** — Record sightings with photos, GPS coordinates, and species identification during trips.
- **Community** — Share public sightings and browse what others have found. Private by default with GPS fuzzing for public posts.
- **Challenges** — Track progress on foraging, seasonal, and park exploration challenges.
- **Guided ID Wizard** — Step-by-step identification scoring to help narrow down species.

## Technology

ForageFlow is built with Next.js 14 (App Router), React, TypeScript, TailwindCSS, and Leaflet for maps. The backend uses PocketBase for authentication and data sync, with Stripe for membership payments. The app runs as a PWA with a Service Worker for offline caching and IndexedDB for local data storage.
