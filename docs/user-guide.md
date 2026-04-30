# ForageFlow User Guide

## Getting Started

ForageFlow is a mobile-first app for discovering mushrooms, plants, trees, parks, and trails across Tennessee. It works offline after your first visit — open it on your phone in the field and everything you need is right there.

### Navigation

The app uses a fixed bottom navigation bar with these tabs:

- **Home** — Seasonal highlights, community preview, and active challenges
- **Field Guide** — Browse and filter species, plants, and trees
- **Map** — Interactive map of Tennessee state parks and trails
- **Trips** — Plan and log foraging trips
- **Community** — Share and browse sightings

Tap any tab to navigate. The active tab is highlighted.

---

## Core Features

### Field Guide

The Field Guide is your species reference. Browse mushrooms, plants, and trees with images, descriptions, habitat info, and seasonal availability.

**Filtering:** Use the filter chips at the top to narrow results:
- **Category** — Mushroom, Plant, or Tree
- **Season** — Spring, Summer, Fall, or Winter
- **Region** — East TN, Middle TN, West TN, or All Regions
- **Edibility** — Filter by edibility classification

Filters combine — selecting "Mushroom" + "East TN" + "Fall" shows only mushrooms found in East Tennessee during fall.

**Species Detail:** Tap any species to see its full detail page with:
- Images and physical descriptions
- Habitat and seasonal information
- Edibility tab with "Overview" and "Could Be" sections
- Toxic lookalikes (always shown before edibility discussion)
- Associated species links (on tree pages, tap to navigate to related species)

**Safety note:** ForageFlow never says something is "safe to eat." The edibility tab provides general information and always directs you to verify with a qualified expert before consuming any wild species.

### Map

The Map page shows all Tennessee state parks, trails, and routes on an interactive map.

**Map view:** Pan and zoom the Leaflet map. Tap a marker to open a detail panel at the top of the screen showing park or trail information. The legend above the map shows what each marker color represents.

**List view:** Toggle to list view for large image cards showing each park or trail with key details (distance, difficulty, amenities). Scroll through the full list of Tennessee state parks.

**Detail panel:** When you tap a marker or list card, a detail panel slides in from the top. It shows the park or trail name, description, and metadata. Close it with the X button or press Escape.

### Trips

Plan foraging trips and log what you find.

**Creating a trip:**
1. Tap the Trips tab
2. Tap "New Trip"
3. Select a location, enter a date, and add notes
4. Save — the trip is stored locally in IndexedDB and works offline

**Expedition Log:** During a trip, log individual sightings with:
- Species identification (or best guess)
- Photos captured from your device camera
- GPS coordinates (private by default)
- Notes and observations

All trip and expedition data is saved locally. When you are back online, pending changes sync to the server.

### Community

Share your sightings and see what others have found.

**Viewing sightings:** The Community page shows public sightings from other users. The home page shows a preview of the 3 most recent public posts.

**Creating a sighting:**
1. Navigate to the Community page
2. Create a new sighting with your species guess, notes, and optional photo
3. Choose visibility: **Private** (default) or **Public**

**Privacy:** Sightings are private by default. Public posts use GPS coordinate fuzzing (approximately 1 km offset) to protect exact locations.

### Challenges

Track your progress on foraging, seasonal, and park exploration challenges.

**Viewing challenges:** The home page shows a preview of up to 3 active challenges. Each challenge card shows:
- Title and description
- Category badge (foraging, seasonal, or park exploration)
- Progress bar showing completed criteria vs. total
- Individual criteria with checkboxes

**Completing challenges:** Check off criteria as you complete them. When all criteria for a challenge are done, the challenge is marked as completed with a completion indicator.

Challenge progress is stored locally and works offline.

---

## Offline Use

ForageFlow is designed to work without internet after your first visit. The following features work fully offline:

- Field Guide (browsing and species detail)
- Map (previously viewed areas with cached tiles)
- Trip creation and editing
- Expedition logging and photo capture
- Challenge progress tracking
- Profile display (cached)

Features that require internet:
- First-time login or signup
- SSO authentication (Google, Apple, Microsoft)
- Community feed (live updates)
- Data sync to server
- AI photo identification

### Adding to Home Screen

For the best experience, add ForageFlow to your home screen:

**iOS Safari:**
1. Tap the Share button (square with arrow)
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add"

**Android Chrome:**
1. Tap the three-dot menu
2. Tap "Add to Home Screen" or "Install app"
3. Confirm

Once installed, ForageFlow opens like a native app with its own icon and full-screen experience.

---

## Safety Reminders

- ForageFlow is an identification aid, not a substitute for expert verification
- Always verify species identification with a qualified expert before consuming any wild species
- Toxic lookalikes are shown prominently on species detail pages
- The app uses cautious language like "commonly considered edible with expert confirmation" — never "safe to eat"
- When in doubt, do not consume
