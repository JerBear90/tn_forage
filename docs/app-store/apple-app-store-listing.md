# ForageWise — Apple App Store Listing

## Important Note for PWAs on iOS

iOS does not support TWA (Trusted Web Activity) like Android. Your options:

1. **Direct PWA install** (recommended for beta): Users visit your URL in Safari and tap "Add to Home Screen." No App Store listing needed. Share the URL with testers directly.

2. **TestFlight with WebView wrapper**: Create a minimal Xcode project with WKWebView pointing to your deployed PWA URL. This gets you into TestFlight for structured beta testing.

3. **Full native wrapper** (future): For public App Store listing, use Capacitor or a similar tool to wrap the PWA with native capabilities.

**For beta testing, option 1 is fastest. Option 2 is recommended if you want structured TestFlight feedback.**

---

## App Store Connect Metadata (for TestFlight / future listing)

### App Name (30 chars max)
```
ForageWise
```

### Subtitle (30 chars max)
```
Forage. Identify. Explore.
```

### Category
Primary: Health & Fitness
Secondary: Lifestyle

### Age Rating
4+ (No objectionable content)

### Price
Free

---

## App Description

### Promotional Text (170 chars, can be updated without new build)
```
Your offline field companion for mushroom and plant discovery in Tennessee. Fruiting forecasts, safety beacon, and 60+ parks mapped.
```

### Description (4000 chars max)
```
ForageWise is your offline-first field companion for mushroom, plant, tree, park, and trail discovery in Tennessee. Built for foragers who need reliable information in areas with no cell service.

FIELD GUIDE
Browse 30+ mushroom species and 16+ plants with detailed identification steps, images, habitat info, seasonal data, and safety notes. Every species includes toxic lookalike warnings.

INTERACTIVE MAP
Explore 60+ Tennessee state parks and trails on an interactive map. Download map areas for offline use in remote locations.

FRUITING FORECAST
Get predictions on which species are likely fruiting based on recent weather — temperature, rainfall, and humidity.

FORAGING JOURNAL
Log your finds with automatic weather and GPS tagging. Discover patterns in when and where you find species over time.

SPORE PRINT SCANNER
Photograph your spore print and match the color against known species for identification assistance.

SAFETY BEACON
Set a safety timer that alerts your emergency contacts if you're away too long. Essential for solo foragers in remote areas.

LOCATION SHARING
Share your real-time location with friends or family while you're in the field.

TRIP PLANNING
Create custom multi-stop routes across parks and trails for weekend foraging trips.

CHALLENGES & BADGES
Complete foraging challenges and earn badges as you explore Tennessee's forests.

WORKS OFFLINE
The entire Field Guide, journal, saved routes, and downloaded map areas work without internet.

SAFETY FIRST
ForageWise never claims anything is "safe to eat." All identifications are possible matches requiring expert verification. Toxic lookalikes are always shown prominently.

Built with real Tennessee data from government sources and university extension resources.
```

### Keywords (100 chars max, comma-separated)
```
foraging,mushroom,field guide,Tennessee,hiking,trails,plants,identification,offline,nature
```

### What's New (Release Notes)
```
Version 3.2.0:
- Fruiting forecast based on weather
- Foraging journal with weather tagging
- Spore print color scanner
- Safety beacon for solo foragers
- Location sharing
- Custom route planning
- Offline map downloads
- Trail condition reporting
- Park check-in with ratings
- Guided trail tours
- Challenge badges
```

---

## Screenshots Required

| # | Device | Size |
|---|--------|------|
| 1-8 | iPhone 6.7" (iPhone 15 Pro Max) | 1290×2796 |
| 1-8 | iPhone 6.1" (iPhone 15) | 1179×2556 |
| 1-8 | iPad Pro 12.9" (optional) | 2048×2732 |

Same 8 screens as Google Play:
1. Field Guide list
2. Species detail with season chart
3. Map view with park markers
4. Fruiting Forecast
5. Foraging Journal
6. Mushroom Calendar
7. Safety Beacon
8. Route Planner

---

## App Icon
- Size: 1024×1024 px (no transparency, no rounded corners — Apple applies the mask)
- Format: PNG
- Must not contain alpha channel

---

## TestFlight Setup (WebView Wrapper)

### Xcode Project Structure

```
ForageWise-iOS/
├── ForageWise.xcodeproj
├── ForageWise/
│   ├── AppDelegate.swift
│   ├── SceneDelegate.swift
│   ├── ViewController.swift      ← WKWebView loading PWA URL
│   ├── Info.plist
│   └── Assets.xcassets/
│       ├── AppIcon.appiconset/   ← 1024×1024 icon
│       └── LaunchImage.imageset/
├── LaunchScreen.storyboard       ← Splash with logo
└── ForageWise.entitlements
```

### Key ViewController.swift

```swift
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        view.addSubview(webView)
        
        if let url = URL(string: "https://foragewise.app") {
            webView.load(URLRequest(url: url))
        }
    }
    
    // Handle external links (open in Safari)
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url,
           url.host != "foragewise.app" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
}
```

### Info.plist Additions
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>ForageWise uses your location to show nearby parks, log finds, and share your position with friends for safety.</string>
<key>NSCameraUsageDescription</key>
<string>ForageWise uses your camera to photograph species for identification and spore print scanning.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>ForageWise accesses your photos to attach images to journal entries and trail condition reports.</string>
```

### TestFlight Steps
1. Create App ID in Apple Developer portal
2. Create app in App Store Connect
3. Archive and upload build from Xcode
4. Add internal testers (up to 100) in TestFlight
5. Testers receive invite via email → install via TestFlight app

---

## Privacy Nutrition Labels (App Store requirement)

### Data Collected

| Data Type | Collected | Linked to Identity | Used for Tracking |
|-----------|-----------|-------------------|-------------------|
| Location (precise) | Yes | Yes | No |
| Location (coarse) | Yes | Yes | No |
| Photos | Yes | Yes | No |
| User Content (journal, reviews) | Yes | Yes | No |
| Identifiers (user ID) | Yes | Yes | No |
| Usage Data (analytics) | Yes | Yes | No |
| Contact Info (email) | Yes | Yes | No |

### Data Use Purposes
- **App Functionality**: Location, photos, user content
- **Analytics**: Usage data (opt-out available)
- **Account**: Contact info, identifiers

### Data NOT Collected
- Health & Fitness data
- Financial data
- Browsing history
- Search history
- Contacts
- Diagnostics (beyond usage analytics)
