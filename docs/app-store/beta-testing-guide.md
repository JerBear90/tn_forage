# ForageWise — Beta Testing Guide

## Quickest Path to Beta Testers

### Option A: Direct PWA (Fastest — No App Store Needed)

**Time to testers: 1 hour after deployment**

1. Deploy your app to a production URL (Vercel recommended for Next.js)
2. Share the URL with testers
3. Testers visit the URL and:
   - **Android**: Chrome shows "Install app" banner → tap to install
   - **iOS**: Safari → Share → "Add to Home Screen"
4. App installs as a standalone PWA with your icon and splash screen

**Pros**: Instant, no review process, no app store fees
**Cons**: No Play Store/App Store discoverability, iOS limitations (no push notifications on older iOS)

### Option B: Google Play Internal Testing (Recommended for structured beta)

**Time to testers: 1-2 days (no review for internal track)**

1. Create a Google Play Developer account ($25 one-time fee)
2. Use PWABuilder to generate an AAB:
   ```bash
   # Visit https://www.pwabuilder.com/
   # Enter your deployed URL
   # Download Android package
   ```
3. Create app in Google Play Console
4. Upload AAB to **Internal testing** track
5. Add tester emails (up to 100 for internal)
6. Testers get an opt-in link → app appears in their Play Store

**Pros**: Real Play Store experience, crash reporting, staged rollout
**Cons**: $25 fee, 1-2 day setup, Android only

### Option C: Apple TestFlight (iOS structured beta)

**Time to testers: 3-5 days (Apple review for TestFlight)**

1. Apple Developer account ($99/year)
2. Create Xcode project with WKWebView (see apple-app-store-listing.md)
3. Archive and upload to App Store Connect
4. Submit for TestFlight review (usually 24-48h)
5. Add testers (up to 100 internal, 10,000 external)

**Pros**: Native iOS experience, structured feedback
**Cons**: $99/year, requires Mac + Xcode, review delay

---

## Recommended Beta Strategy

### Phase 1: Friends & Family (Week 1)
- Deploy PWA to production URL
- Share with 5-10 trusted people
- Use in-app feedback form to collect issues
- Fix critical bugs

### Phase 2: Expanded Beta (Week 2-3)
- Set up Google Play Internal Testing
- Add 20-50 testers
- Monitor crash reports and feedback
- Iterate on UX issues

### Phase 3: Public Beta (Week 4+)
- Move to Open Testing track on Google Play
- Consider TestFlight for iOS users
- Collect broader feedback before public launch

---

## What to Tell Beta Testers

### Invitation Message Template

```
Hey! I'm building ForageWise — an offline-first foraging app for Tennessee. 
I'd love your help testing it before public launch.

What it does:
- Field guide with 30+ mushroom species and 16+ plants
- Interactive map of 60+ TN state parks and trails
- Fruiting forecasts based on weather
- Safety beacon for solo foragers
- Works offline in areas with no signal

To install:
[Android] Visit [URL] in Chrome → tap "Install app" when prompted
[iPhone] Visit [URL] in Safari → Share → "Add to Home Screen"

Please use the "Send Feedback" button in Settings to report any bugs 
or suggestions. I'm especially interested in:
- Does it work offline? (try airplane mode)
- Is the species info accurate?
- Any crashes or weird behavior?
- What features would you use most?

Thanks for helping!
```

---

## Collecting Feedback

### In-App (Primary)
- "Send Feedback" button in Settings (Req 35)
- Automatically captures device info, app version, OS
- Works offline (queues for sync)

### External (Supplementary)
- Google Form for structured surveys
- Discord/Slack channel for real-time discussion
- GitHub Issues for technical bug reports

### Key Metrics to Track
- Daily active users
- Most-used features (via usage analytics)
- Crash rate
- Offline usage percentage
- Feature requests (categorized)
- Time spent in app per session

---

## Pre-Launch Checklist

Before inviting testers:

- [ ] App deployed to production URL with HTTPS
- [ ] All automated tests passing
- [ ] Manual testing checklist completed (see docs/manual-testing-checklist.md)
- [ ] Privacy Policy and Terms of Service pages live
- [ ] Feedback form working (test submission)
- [ ] Error boundary catches crashes gracefully
- [ ] App version displayed in Settings
- [ ] Offline mode works (airplane mode test)
- [ ] PWA installs correctly on Android Chrome
- [ ] PWA installs correctly on iOS Safari
- [ ] No console errors in production build
- [ ] Lighthouse PWA score > 90
- [ ] Performance: loads < 3s on 4G

---

## After Beta: Preparing for Public Launch

Once beta feedback is incorporated:

1. **Fix all critical bugs** reported by testers
2. **Polish UX** based on feedback patterns
3. **Capture screenshots** on real devices for store listings
4. **Write release notes** highlighting key features
5. **Move to Production track** on Google Play
6. **Submit for App Store review** (if using TestFlight wrapper)
7. **Announce launch** on social media, foraging communities, Reddit r/foraging
