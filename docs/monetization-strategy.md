# ForageWise Monetization Strategy

## Overview

ForageWise is an offline-first foraging companion app for Tennessee. The monetization model is **freemium** — a generous free tier that hooks users, with premium features that serious foragers will pay for.

## Revenue Streams

### 1. Membership Subscriptions (Primary)

| Tier | Price | Early Beta Price | Features |
|------|-------|-----------------|----------|
| **Free** | $0 | $0 | Full field guide, 1 offline map region, 3 AI IDs/day, view community, basic trip planning |
| **Pro** | $4.99/mo or $39.99/yr | **$2.99/mo or $24.99/yr** | Unlimited AI IDs, all 3 map regions, post to community, export data, advanced forecasts, priority support |
| **Lifetime** | $79.99 one-time | **$49.99 one-time** | Everything in Pro, forever. Early adopter pricing. |

**Early Beta Tester Discount:**
- Users who sign up during the beta period receive a permanent discount
- Beta pricing is locked in for the life of their subscription
- Coupon code system will be integrated via Stripe (e.g., `BETA2026`, `EARLYBIRD`)
- Codes can be generated and managed in Admin Dashboard → Settings
- Limited to first 200 subscribers

**Why this works:**
- Free tier is genuinely useful (offline field guide alone is valuable)
- Pro features target repeat users who forage weekly
- Lifetime appeals to dedicated foragers who hate subscriptions

**Implementation:**
- Stripe Checkout (already integrated)
- `MonetizationGate` component wraps premium features
- Admin dashboard → Settings → Stripe keys
- PocketBase stores membership status, syncs on login

### 2. In-App Purchases (Future)

| Item | Price | What |
|------|-------|------|
| Additional state packs | $2.99 each | Expand beyond Tennessee (Kentucky, North Carolina, Georgia, Virginia) |
| Premium species packs | $1.99 each | Rare/advanced species with detailed ID guides |
| Offline map bundles | $0.99 each | High-res topographic tiles for specific parks |

**Architecture Decision: One App, All States**

Ship one app with Tennessee free. Additional states are unlocked via state packs ($2.99) or included in Pro membership. Reasons:
- Single codebase to maintain
- Users who travel don't need multiple apps
- Better App Store ranking (one app with more downloads)
- State packs = recurring revenue from existing users
- Data architecture already supports it — just add seed data per state

### 3. Affiliate Revenue (Passive)

- Link to foraging gear on Amazon (knife, basket, field guides)
- Partner with local foraging workshops/classes
- Tennessee State Parks merchandise links
- Commission: 4-8% per sale

**Implementation:** Add an "Essential Gear" section to the app with affiliate links. Track clicks via UTM parameters.

### 4. Sponsored Content (Future)

- Local foraging tour operators pay for featured listings
- Mushroom cultivation supply companies
- Outdoor gear brands (Merrell, REI, etc.)
- Rate: $50-200/month per featured spot

**Rules:** Clearly labeled as "Sponsored." Never compromise safety content.

---

## Monetization Gates (What to Lock)

### Gate with `MonetizationGate` component:

```tsx
import MonetizationGate from '@/components/MonetizationGate';

<MonetizationGate
  feature="Unlimited AI Identifications"
  description="Free users get 3 per day"
>
  <AIIdentificationResult />
</MonetizationGate>
```

### Features to gate:

| Feature | Free Limit | Pro |
|---------|-----------|-----|
| AI photo identification | 3/day | Unlimited |
| Offline map downloads | 1 region | All 3 regions |
| Community posting | View only | Post + review |
| Trip data export (CSV/PDF) | ❌ | ✅ |
| Advanced foraging forecast | Basic (good/bad) | Detailed (hourly, species-specific) |
| Expedition log photos | 5 per log | Unlimited |
| Custom routes | 1 saved | Unlimited |
| Priority support | ❌ | ✅ (24hr response) |

### Features that stay FREE (never gate these):

- Full species field guide (this is the hook)
- Basic trip planning
- Safety warnings and toxic lookalikes
- Offline access to cached data
- Dark mode, accessibility features
- Basic weather display

---

## Pricing Psychology

1. **Anchor high, offer low** — Show yearly price first ($39.99/yr = $3.33/mo feels cheap)
2. **Loss aversion** — "You've used 3/3 AI IDs today. Upgrade for unlimited."
3. **Social proof** — "Join 500+ Tennessee foragers on Pro"
4. **Trial period** — 7-day free Pro trial on signup (no credit card required)
5. **Seasonal urgency** — "Morel season starts in 2 weeks. Upgrade now for AI ID."

---

## Implementation Checklist

### Already Built:
- [x] Stripe integration (checkout + webhook)
- [x] Membership page with plan comparison
- [x] `MonetizationGate` component
- [x] Admin settings for Stripe keys
- [x] Role hierarchy (guest < free < member < super_user)
- [x] Offline map download infrastructure
- [x] AI identification page
- [x] Community with auth gating
- [x] Usage tracking (AI IDs per day counter, feature usage, sessions)
- [x] Admin can manually set user membership from dashboard
- [x] Terms of Service page
- [x] Privacy Policy page

### To Build for Launch:
- [ ] Usage tracking (AI IDs per day counter)
- [ ] 7-day free trial flow
- [ ] Coupon code system (Stripe Promotion Codes)
- [ ] Beta discount codes: `BETA2026`, `EARLYBIRD`, `FOUNDER`
- [ ] Upgrade prompts at natural friction points
- [ ] Receipt emails via SendGrid/Resend
- [ ] Cancellation flow with retention offer
- [ ] App Store in-app purchase integration (for iOS)
- [ ] Google Play billing integration (for Android)

### Post-Launch:
- [ ] A/B test pricing ($3.99 vs $4.99 vs $5.99)
- [ ] Annual plan discount experiments
- [ ] Referral program (give a month, get a month)
- [ ] State expansion packs
- [ ] Corporate/group licenses for foraging clubs

---

## Revenue Projections (Conservative)

| Month | Free Users | Pro Subscribers | MRR |
|-------|-----------|----------------|-----|
| 1 | 200 | 5 | $25 |
| 3 | 800 | 30 | $150 |
| 6 | 2,000 | 100 | $500 |
| 12 | 5,000 | 300 | $1,500 |
| 24 | 15,000 | 1,000 | $5,000 |

**Assumptions:** 5% free-to-paid conversion, 3% monthly churn, Tennessee-focused initially.

**Breakeven:** ~60 Pro subscribers covers hosting + API costs (~$300/mo).

---

## API Keys Required (Admin Dashboard → Settings)

| Service | Purpose | Cost |
|---------|---------|------|
| Stripe | Payments | 2.9% + $0.30 per transaction |
| OpenAI or Claude | AI species identification | ~$0.01-0.05 per ID |
| SendGrid or Resend | Transactional emails | Free tier: 100/day |
| Google OAuth | SSO login | Free |
| PocketBase | Backend/auth | Self-hosted (free) |
| weather.gov | Weather data | Free (no key needed) |
| OpenStreetMap | Map tiles | Free (attribution required) |

**Total fixed costs:** ~$20-50/month (PocketBase hosting + domain)
**Variable costs:** Scale with usage (AI IDs, emails)

---

## Key Metrics to Track (Already in Admin Dashboard)

All metrics below are tracked via the usage tracker (`src/services/usageTracker.ts`) and admin analytics:

- **Conversion rate:** Free → Pro (target: 5%)
- **Churn rate:** Monthly Pro cancellations (target: <5%)
- **LTV:** Lifetime value per subscriber (Pro monthly avg 8 months = $40, Lifetime = $50-80)
- **CAC:** Cost to acquire a paying user (target: <$10 via organic/SEO)
- **DAU/MAU:** Daily/monthly active users (tracked via session counter)
- **Feature usage:** Which premium features drive upgrades (AI IDs, map downloads, community posts)
- **Trial-to-paid:** 7-day trial conversion rate (target: 20%)
- **AI ID usage:** Daily count per user (free limit: 3/day, tracked in localStorage)
- **Retention:** Day 1, Day 7, Day 30 return rates
- **Offline usage:** How often users access the app without internet

---

## Launch Strategy

1. **Soft launch** (now): Free app, no paywall, gather feedback
2. **Beta monetization** (after 500 users): Enable Pro tier with beta discount codes (`BETA2026` = 40% off forever)
3. **Full launch** (after 1,000 users): App Store listing, remove beta pricing, standard rates
4. **Expansion** (after 5,000 users): Additional states, partnerships

### Beta Coupon Codes (To Be Integrated via Stripe)

| Code | Discount | Duration | Limit |
|------|----------|----------|-------|
| `BETA2026` | 40% off | Forever (while subscribed) | First 200 users |
| `EARLYBIRD` | 30% off | First 6 months | First 500 users |
| `FOUNDER` | 50% off Lifetime | One-time | First 50 users |

**Implementation notes:**
- Codes will be created as Stripe Promotion Codes via the Stripe Dashboard
- The membership page will include a "Have a code?" input field
- Codes are validated server-side through Stripe's API
- Admin can create/revoke codes from Stripe Dashboard or future admin panel integration
- Each code tracks redemption count automatically

---

## Legal Considerations

- Terms of Service must state: "ForageWise provides identification assistance only"
- Refund policy: 30-day money-back guarantee
- Auto-renewal disclosure required by Apple/Google
- GDPR/CCPA compliance for user data
- Affiliate links must be disclosed (FTC requirement)
