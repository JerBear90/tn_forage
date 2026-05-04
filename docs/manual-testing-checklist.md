# ForageFlow Phase 3.2 — Manual Testing Checklist

## Pre-Testing Setup

- [ ] Build the app in production mode (`npm run build`)
- [ ] Verify no build errors or warnings
- [ ] Run automated tests (`npx vitest --run`) — all should pass
- [ ] Test on real devices: iPhone (Safari), Android (Chrome), Desktop (Chrome/Firefox)
- [ ] Test with airplane mode for offline scenarios
- [ ] Clear IndexedDB/cache for fresh install testing

---

## 1. Bottom Navigation (Req 1)

- [ ] All 5 nav labels are centered under their icons
- [ ] Active tab shows brand-teal color
- [ ] Touch targets are large enough (no accidental mis-taps)
- [ ] Labels don't overflow or truncate on small screens (320px)

## 2. Blog Feed (Req 2)

- [ ] Blog feed page loads and displays articles
- [ ] Articles show title, date, author, summary, cover image
- [ ] Tapping an article opens the full detail view
- [ ] Source attribution is visible with links to original sources
- [ ] No banned safety phrases in any article text
- [ ] Articles load offline after first visit (airplane mode test)
- [ ] Feed is in reverse-chronological order (newest first)

## 3. Park Plants & Medicinal Info (Req 3)

- [ ] Park detail page shows plants found at the park
- [ ] Each plant shows common name, scientific name, image
- [ ] Medicinal plants show uses, parts used, preparation
- [ ] Medicinal disclaimer is prominently displayed
- [ ] Transplant guide shows for legal/non-invasive plants
- [ ] Transplant disclaimer is visible
- [ ] Protected/invasive plants show warning instead of transplant guide
- [ ] No banned safety phrases anywhere
- [ ] Works offline

## 4. Location Sharing (Req 4)

- [ ] Can start a sharing session with duration selection
- [ ] Shareable link is generated and copyable
- [ ] Shows list of people you're sharing with
- [ ] Location updates at ~60 second intervals
- [ ] Session auto-expires after set duration
- [ ] Can manually stop sharing early
- [ ] Opening a share link shows the sharer's position on map
- [ ] GPS permission is requested before sharing starts

## 5. Landing Page (Req 5)

- [ ] Page loads and displays correctly on mobile (320px)
- [ ] Page displays correctly on tablet (768px)
- [ ] Page displays correctly on desktop (1280px)
- [ ] ForageFlow logo is visible and current
- [ ] Brand colors match (teal, forest green, sand, charcoal)
- [ ] Tagline "Discover. Identify. Explore safely." is present
- [ ] CTA button is visible and clickable
- [ ] Page loads quickly (< 3 seconds on throttled connection)
- [ ] Images have alt text
- [ ] Heading hierarchy is correct (h1 → h2 → h3)

## 6. Auth Changes (Req 6)

- [ ] Login page shows Google SSO button
- [ ] Login page does NOT show Apple button
- [ ] Login page does NOT show Microsoft button
- [ ] Email/password login still works
- [ ] Google SSO login still works

## 7. Offline Map Downloads (Req 7)

- [ ] Can select a region to download (browse map or select park)
- [ ] Download shows progress percentage
- [ ] Downloaded regions appear in a list
- [ ] Can delete a downloaded region
- [ ] Map renders offline in downloaded areas
- [ ] Shows "tiles not available" message outside downloaded areas when offline
- [ ] Trail and park data available offline in downloaded regions

## 8. Challenge Badges (Req 8)

- [ ] Completing a challenge awards a badge
- [ ] Badge notification/animation appears on earn
- [ ] Badge gallery shows earned badges on profile
- [ ] Unearned badges appear grayed out/locked
- [ ] Tapping a badge shows detail (description, date earned)
- [ ] Works offline

## 9. Custom Route Planning (Req 9)

- [ ] Can create a new route with multiple waypoints
- [ ] Waypoints show on the map with numbers and connecting lines
- [ ] Can add parks, trails, or custom GPS points as waypoints
- [ ] Can reorder waypoints
- [ ] Can add notes to waypoints
- [ ] Shows total distance and estimated drive time
- [ ] Can save and name a route
- [ ] Saved routes load and display correctly
- [ ] Works offline with cached data

## 10. Live Trail Conditions (Req 10)

- [ ] Trail conditions display on park detail page (when online)
- [ ] Color-coded indicators on map (green/yellow/red)
- [ ] Closure notices show reason and expected reopening
- [ ] Cached conditions display offline with "last updated" timestamp
- [ ] "No recent reports" shown when no data available

## 11. Beacon/Safety Button (Req 11)

- [ ] Beacon button accessible from trip tracking and navigation
- [ ] Can set expected return time / inactivity duration
- [ ] Can configure up to 3 emergency contacts
- [ ] Active beacon shows persistent indicator with remaining time
- [ ] Can deactivate beacon or extend timer
- [ ] "All clear" sent when deactivated
- [ ] Alert triggers after inactivity exceeds duration (test with short timer)

## 12. Recreation.gov Integration (Req 12)

- [ ] Park detail shows facility info when available
- [ ] Campsite availability and reservation links display
- [ ] Activity listings show
- [ ] Link to recreation.gov page is present
- [ ] Data caches for offline (24h expiration)
- [ ] Section omitted gracefully when no data available

## 13. Events & Festivals (Req 13)

- [ ] Events page shows upcoming events sorted by date
- [ ] Each event shows title, date, location, description
- [ ] Registration link opens in browser when available
- [ ] Can filter by type (festival, workshop, outing)
- [ ] Can filter by date range
- [ ] Events cache for offline viewing

## 14. Park Entry Fees (Req 14)

- [ ] Fee info displays on park detail page
- [ ] Shows per-vehicle, per-person, annual pass options
- [ ] "Free entry" shown for free parks
- [ ] "Contact park for fee info" when no data available
- [ ] Works offline

## 15. Guided Tours (Req 15)

- [ ] "Guided Tour Available" indicator on trail listing
- [ ] Starting a tour shows map with waypoints
- [ ] At least 3 waypoints per tour
- [ ] Waypoint description appears when within ~50m
- [ ] Safety reminder at tour start
- [ ] No banned safety phrases
- [ ] Works offline

## 16. Park Check-In (Req 16)

- [ ] "Check In" button on park detail page
- [ ] Check-in creates a record with timestamp
- [ ] Can add to-do items
- [ ] Can mark to-do items complete
- [ ] Can rate park (1-5 stars)
- [ ] Can share check-in (Web Share API or copy link)
- [ ] Check-in history shows on profile
- [ ] Works offline (syncs later)

## 17. Trail Condition Reporting (Req 17)

- [ ] "Report Conditions" button on trail view
- [ ] Can select condition categories (clear, issues, bad/closed, dry, muddy, snowy)
- [ ] Can select multiple categories
- [ ] Optional text field works (max 500 chars)
- [ ] Optional photo upload works
- [ ] Recent reports display on trail detail
- [ ] Works offline (queues for sync)

## 18. Feature Access Flags (Req 18)

- [ ] All features are accessible (no restrictions in this phase)
- [ ] No "upgrade" prompts appear anywhere

## 19. Onboarding (Req 19)

- [ ] First launch shows walkthrough (clear IndexedDB to test)
- [ ] 4-6 screens with icons, headlines, descriptions
- [ ] "Skip" button works on every screen
- [ ] "Get Started" on final screen dismisses walkthrough
- [ ] Walkthrough does NOT appear on subsequent launches
- [ ] Accessible (focus management, screen reader)

## 20. Usage Analytics (Req 20)

- [ ] Feature interactions are logged (check IndexedDB `usageEvents` store)
- [ ] No GPS or free-text in logged events
- [ ] Opt-out toggle in settings stops logging
- [ ] Events older than 7 days are purged

## 21. Push Notifications (Req 21)

- [ ] Permission requested at appropriate moment (not on first load)
- [ ] Beacon alerts delivered via push
- [ ] Event reminders work (24h before bookmarked event)
- [ ] Blog notifications configurable in settings
- [ ] App works fine if permission denied (no re-prompt)

## 22. Terms of Service & Privacy Policy (Req 22)

- [ ] ToS page accessible from settings
- [ ] Privacy Policy page accessible from settings
- [ ] Both accessible from landing page footer
- [ ] Content renders correctly
- [ ] Pages work offline

## 23. Account Deletion & Data Export (Req 23)

- [ ] "Export My Data" generates downloadable JSON
- [ ] Export includes profile, trips, logs, check-ins, reviews, journal, badges
- [ ] Export does NOT include photo blobs
- [ ] Export completes within 30 seconds
- [ ] "Delete My Account" shows confirmation dialog
- [ ] After deletion, all local data is cleared
- [ ] Redirects to login page with confirmation message
- [ ] Works offline (local data cleared, server deletion queued)

## 24. Foraging Journal (Req 24)

- [ ] "Log Find" accessible from species detail, map, trip tracking
- [ ] Auto-captures GPS, date, time, weather
- [ ] Can attach photo, select species, add notes
- [ ] Journal shows chronological history
- [ ] "Patterns" view shows correlations
- [ ] Entries default to private
- [ ] Works offline (weather cached or marked unavailable)

## 25. Fruiting Forecast (Req 25)

- [ ] Forecast section shows species likely fruiting
- [ ] Each prediction shows confidence (high/medium/low)
- [ ] Weather factors that triggered prediction are listed
- [ ] Disclaimer present
- [ ] Updates daily when online
- [ ] Cached forecast shows offline with timestamp
- [ ] No banned safety phrases

## 26. Spore Print Scanner (Req 26)

- [ ] Can photograph a spore print
- [ ] App extracts dominant color
- [ ] Returns top 5 species matches with color swatches
- [ ] Confidence percentage shown
- [ ] Disclaimer present
- [ ] Photography tips/guidance shown
- [ ] Works entirely offline
- [ ] No banned safety phrases

## 27. Harvest Log (Req 27)

- [ ] Can record what was picked, quantity, location
- [ ] Sustainability indicator shows (green/yellow/red)
- [ ] Rotation reminder at 3+ harvests from same spot
- [ ] Seasonal summary shows totals
- [ ] Exact locations never shared (500m precision for shared data)
- [ ] Works offline

## 28. Microhabitat Mapping (Req 28)

- [ ] Can pin a precise GPS location with habitat details
- [ ] Captures slope, water proximity, trees, substrate
- [ ] Can attach photos
- [ ] Pins are private by default (not visible to others)
- [ ] Private map layer shows user's pins
- [ ] Visit history tracks returns to same spot
- [ ] Success rate displays correctly
- [ ] Sync preference (local-only vs sync) is respected
- [ ] Works offline

## 29. Voice ID Assistant (Req 29)

- [ ] Accessible from identification screen
- [ ] Speech-to-text works (or falls back to text input)
- [ ] Parses description into identification features
- [ ] Returns ranked species matches (top 5)
- [ ] Disclaimer present
- [ ] Works entirely offline
- [ ] No banned safety phrases

## 30. Buddy Matching (Req 30)

- [ ] Can create foraging profile (experience, interests, parks, availability)
- [ ] Shows potential matches based on proximity and interests
- [ ] Can send/receive outing invitations
- [ ] Requires mutual opt-in (profile only visible to other opted-in users)
- [ ] Can rate outings after completion
- [ ] Safety notice displayed
- [ ] Works offline for viewing (online for invitations)

## 31. Seasonal Countdowns (Req 31)

- [ ] Countdown timers show on home/field guide
- [ ] Shows estimated days until species season starts
- [ ] Updates estimate with new weather data
- [ ] Shows "In season now" when countdown reaches zero
- [ ] Disclaimer about estimates present
- [ ] Can select which species to track
- [ ] Works offline (less precise without weather updates)

## 32. Lookalike Comparison (Req 32)

- [ ] "Compare with Lookalike" button on species with toxic lookalikes
- [ ] Side-by-side display with images
- [ ] Dangerous differences highlighted in red
- [ ] Swipeable image carousel for each species
- [ ] "Key Differences" summary list (3-5 items)
- [ ] Safety warning at top
- [ ] Works offline
- [ ] No banned safety phrases

## 33. Field Photography Guide (Req 33)

- [ ] Accessible from camera/photo capture and ID flow
- [ ] Shows checklist of recommended photos (cap, gills, stem, cross-section, habitat, scale)
- [ ] Reference photos shown for each angle
- [ ] Species-specific tips when photographing a known species
- [ ] Field photography tips (lighting, scale, background)
- [ ] Works offline (all images bundled)
- [ ] Accessible (alt text, screen reader support)

## 34. App Store Readiness (Req 34)

- [ ] All manifest icons present and correct sizes
- [ ] App installs as PWA on iOS (Add to Home Screen)
- [ ] App installs as PWA on Android (Install prompt)
- [ ] Splash screen shows during load
- [ ] Error boundary catches crashes (test by triggering an error)
- [ ] Version number shows in settings

## 35. Beta Feedback (Req 35)

- [ ] "Send Feedback" button in settings
- [ ] Form shows type, description, screenshot fields
- [ ] Device info auto-attached
- [ ] Submits when online
- [ ] Queues when offline
- [ ] Confirmation message after submission

---

## Cross-Cutting Checks

### Offline Behavior
- [ ] Turn on airplane mode and verify all offline-capable features work
- [ ] Verify sync queue processes when coming back online
- [ ] Verify cached data displays with "last updated" timestamps

### Safety Language
- [ ] Search all visible text for "safe to eat" — should find ZERO
- [ ] Search for "definitely edible" — should find ZERO
- [ ] Search for "confirmed edible" — should find ZERO
- [ ] Search for "AI verified" — should find ZERO

### Accessibility
- [ ] Test with VoiceOver (iOS) or TalkBack (Android)
- [ ] All interactive elements are keyboard accessible
- [ ] Color is not the only indicator (dots, text, patterns used too)
- [ ] Sufficient color contrast (WCAG AA)

### Performance
- [ ] App loads within 3 seconds on 4G
- [ ] No janky scrolling on species lists or blog feed
- [ ] Map renders smoothly with all layers
- [ ] Offline map tiles load without delay

### Device Testing Matrix
- [ ] iPhone SE (small screen, 375px)
- [ ] iPhone 14/15 (standard)
- [ ] Android phone (Chrome)
- [ ] iPad / Android tablet
- [ ] Desktop Chrome
- [ ] Desktop Firefox

---

## App Store Submission Checklist

### Before Submission
- [ ] All manual tests above pass
- [ ] No console errors in production build
- [ ] Privacy Policy URL ready and accessible
- [ ] Terms of Service URL ready and accessible
- [ ] App screenshots captured (phone + tablet)
- [ ] App description written (short + long)
- [ ] Keywords selected
- [ ] Category selected (Health & Fitness or Lifestyle)
- [ ] Age rating determined (likely 4+ / Everyone)
- [ ] Contact email for support configured

### For Google Play Store (TWA/PWA)
- [ ] Generate signed APK/AAB using Bubblewrap or PWABuilder
- [ ] Digital Asset Links file (`assetlinks.json`) configured
- [ ] App passes Google Play pre-launch report
- [ ] Internal testing track set up
- [ ] Testers added to internal testing group

### For Apple App Store (PWA via Safari)
- [ ] Note: PWAs on iOS install via "Add to Home Screen" — no App Store listing needed for beta
- [ ] Alternative: Use TestFlight with a WebView wrapper if App Store listing is required
- [ ] If using TestFlight: Xcode project with WKWebView pointing to deployed PWA URL

### For Web (Direct PWA)
- [ ] Deploy to production URL (Vercel, Netlify, or similar)
- [ ] HTTPS configured
- [ ] Service worker registered and caching correctly
- [ ] Lighthouse PWA audit score > 90
- [ ] Share beta URL with testers directly
