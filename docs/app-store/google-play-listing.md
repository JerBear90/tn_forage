# ForageFlow — Google Play Store Listing

## App Details

**Package Name:** `com.forageflow.app`
**Category:** Health & Fitness (or Lifestyle > Outdoors)
**Content Rating:** Everyone (IARC: 3+)
**Target Age:** All ages
**Contact Email:** support@forageflow.app
**Privacy Policy URL:** https://forageflow.app/privacy
**Terms of Service URL:** https://forageflow.app/terms

---

## Store Listing Content

### App Name (30 chars max)
```
ForageFlow
```

### Short Description (80 chars max)
```
Offline field guide for mushroom, plant & trail discovery in Tennessee.
```

### Full Description (4000 chars max)
```
ForageFlow is your offline-first field companion for mushroom, plant, tree, park, and trail discovery in Tennessee. Built for foragers who need reliable information in areas with no cell service.

🍄 FIELD GUIDE
Browse 30+ mushroom species and 16+ plants with detailed identification steps, images, habitat info, seasonal data, and safety notes. Every species includes toxic lookalike warnings so you know what to watch out for.

🗺️ INTERACTIVE MAP
Explore 60+ Tennessee state parks and trails on an interactive map. See park details, trail difficulty, distance, and likely species. Download map areas for offline use.

📅 MUSHROOM CALENDAR
See which mushrooms are in season each month with foraging tips specific to Tennessee conditions. Plan your outings around peak fruiting times.

🌡️ FRUITING FORECAST
Get predictions on which species are likely fruiting based on recent weather — temperature, rainfall, and humidity. Know when to head out.

📓 FORAGING JOURNAL
Log your finds with automatic weather and GPS tagging. Over time, discover patterns in when and where you find species.

🔬 SPORE PRINT SCANNER
Photograph your spore print and match the color against known species. One more tool in your identification toolkit.

🏕️ TRIP PLANNING
Create custom multi-stop routes across parks and trails. Plan weekend foraging trips with waypoints, notes, and time estimates.

🚨 SAFETY BEACON
Heading into remote areas? Set a safety timer that alerts your emergency contacts if you're away too long. Peace of mind for solo foragers.

📍 LOCATION SHARING
Share your real-time location with friends or family for a set duration while you're in the field. They can track your position on a map.

🏆 CHALLENGES & BADGES
Complete foraging challenges and earn badges. Track your progress across seasonal finds, park visits, and species discoveries.

👥 BUDDY MATCHING
Connect with nearby foragers of similar interests and experience levels for group outings.

⚠️ SAFETY FIRST
ForageFlow never tells you something is "safe to eat." All identifications are possible matches that require verification by a qualified expert. Toxic lookalikes are always shown prominently.

📶 WORKS OFFLINE
The entire Field Guide, your journal, saved routes, and downloaded map areas work without internet. Perfect for remote trails with no signal.

🌿 TENNESSEE FOCUSED
All park, trail, and species data is sourced from Tennessee government websites and university extension resources. Real data, not AI-generated content.

Download ForageFlow and explore Tennessee's forests with confidence.
```

### What's New (Release Notes — 500 chars max)
```
Phase 3.2 Release:
• Fruiting forecast based on weather conditions
• Foraging journal with automatic weather tagging
• Spore print color scanner
• Safety beacon for solo foragers
• Location sharing with friends
• Custom route planning for weekend trips
• Blog with curated foraging articles
• Offline map downloads
• Trail condition reporting
• Park check-in system with ratings
• Guided trail tours
• Buddy matching for group outings
• Challenge badges
```

---

## Keywords / Tags
```
foraging, mushroom identification, field guide, Tennessee parks, hiking trails, offline maps, mushroom hunting, plant identification, nature, outdoor, trail conditions, foraging journal, spore print, safety
```

---

## Screenshots Required

| # | Screen | Description |
|---|--------|-------------|
| 1 | Field Guide list | Species grid with search and filters |
| 2 | Species detail | Full species page with season chart, images, safety info |
| 3 | Map view | Interactive map with park markers and layers |
| 4 | Fruiting Forecast | Weather-based predictions with confidence levels |
| 5 | Foraging Journal | Journal entries with weather context |
| 6 | Mushroom Calendar | 12-month view with species thumbnails |
| 7 | Safety Beacon | Beacon activation with timer and contacts |
| 8 | Route Planner | Custom route with waypoints on map |

**Screenshot specs:**
- Phone: 1080×1920 or 1440×2560 (16:9)
- Tablet (optional): 1200×1920 (7-inch) or 1600×2560 (10-inch)
- Format: PNG or JPEG
- No device frames required (Google adds them)

---

## Feature Graphic
- Size: 1024×500 px
- Content: ForageFlow logo + tagline "Discover. Identify. Explore safely." on brand sand background with subtle mushroom/forest imagery
- Format: PNG or JPEG

---

## App Icon
- Size: 512×512 px (already have at `public/icons/icon-512x512.png`)
- Must not be transparent
- Should match the maskable icon design

---

## TWA (Trusted Web Activity) Configuration

For wrapping the PWA as an Android app:

```json
{
  "host": "forageflow.app",
  "name": "ForageFlow",
  "launcherName": "ForageFlow",
  "display": "standalone",
  "themeColor": "#0F766E",
  "navigationColor": "#0F766E",
  "backgroundColor": "#F5F0DF",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://forageflow.app/icons/icon-512x512.png",
  "maskableIconUrl": "https://forageflow.app/icons/icon-maskable-512x512.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./forageflow-keystore.jks",
    "alias": "forageflow"
  },
  "appVersionCode": 1,
  "appVersionName": "3.2.0",
  "shortcuts": [],
  "generatorApp": "pwabuilder"
}
```

### Digital Asset Links (`/.well-known/assetlinks.json`)

This file must be served at `https://forageflow.app/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.forageflow.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

**To generate the fingerprint:**
```bash
keytool -list -v -keystore forageflow-keystore.jks -alias forageflow
```

---

## Build Steps (using PWABuilder)

1. Go to https://www.pwabuilder.com/
2. Enter your deployed PWA URL
3. Click "Package for stores" → Android
4. Download the generated APK/AAB
5. Or use Bubblewrap CLI:

```bash
npm install -g @nicolo-ribaudo/bubblewrap
bubblewrap init --manifest https://forageflow.app/manifest.json
bubblewrap build
```

---

## Internal Testing Setup

1. Go to Google Play Console → Create app
2. Fill in store listing (copy from above)
3. Upload AAB to Internal testing track
4. Add tester email addresses
5. Testers receive an opt-in link via email
6. After opt-in, app appears in their Play Store
