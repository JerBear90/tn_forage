# ForageFlow Developer Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| npm | 9+ | Package manager |
| PocketBase | Latest | Backend (auth, data, file storage) |
| Stripe CLI | Latest | Webhook testing (optional) |
| Git | 2.x+ | Version control |

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd forageflow

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.local.example .env.local

# 4. Start PocketBase (in a separate terminal)
./pocketbase serve

# 5. Start the dev server
npm run dev

# 6. Open http://localhost:3000
```

## Environment Configuration

### Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Reference template with all variables |
| `.env.local.example` | Copy this to `.env.local` for development |
| `.env.sso.example` | SSO-specific variables (no secrets) |
| `.env.local` | Your local config (gitignored) |

### Required Variables

```env
# Public variables (exposed to browser)
NEXT_PUBLIC_APP_NAME=ForageFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Server-only variables (never in browser bundle)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# PocketBase admin (for webhook handler)
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

Variables prefixed with `NEXT_PUBLIC_` are included in the browser bundle. All other variables are server-only and accessible only in API routes and server components.

## PocketBase Setup

### 1. Download PocketBase

Download from [pocketbase.io](https://pocketbase.io/docs/):

```bash
# macOS (Apple Silicon)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_darwin_arm64.zip
unzip pocketbase_0.26.8_darwin_arm64.zip

# Linux
wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.8/pocketbase_0.26.8_linux_amd64.zip
unzip pocketbase_0.26.8_linux_amd64.zip
```

### 2. Start PocketBase

```bash
./pocketbase serve
# Admin UI: http://127.0.0.1:8090/_/
# API: http://127.0.0.1:8090/api/
```

### 3. Create Admin Account

On first run, PocketBase will prompt you to create an admin account at `http://127.0.0.1:8090/_/`.

### 4. Configure Users Collection

The `users` collection needs these additional fields:

| Field | Type | Description |
|-------|------|-------------|
| `role` | Text | `guest`, `free`, `member`, `super_user` |
| `membershipPlan` | Text | `free`, `monthly`, `yearly`, `lifetime`, `admin` |
| `membershipStatus` | Text | `inactive`, `active`, `trialing`, `past_due`, `canceled` |
| `stripeCustomerId` | Text | Stripe customer ID |
| `subscriptionId` | Text | Stripe subscription ID |
| `currentPeriodEnd` | Date | Subscription period end |
| `membershipLastVerifiedAt` | Date | Last webhook verification timestamp |

Set default values:
- `role`: `free`
- `membershipPlan`: `free`
- `membershipStatus`: `inactive`

### 5. Configure OAuth Providers (Optional)

For SSO support, configure providers in PocketBase admin:
1. Go to **Settings → Auth providers**
2. Enable Google, Apple, and/or Microsoft
3. Enter client IDs and secrets from each provider
4. See `docs/security/sso-provider-setup.md` for detailed instructions

## Stripe Setup (Optional)

### 1. Create Stripe Account
Sign up at [stripe.com](https://stripe.com) and get test API keys.

### 2. Configure Products
Create products and prices in the Stripe Dashboard:
- Monthly plan (recurring, monthly interval)
- Yearly plan (recurring, yearly interval)

### 3. Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret (whsec_...) to .env.local
```

### 4. Trigger Test Events

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

## Development Commands

```bash
# Start dev server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run unit + integration tests
npm test

# Watch mode for tests
npm run test:watch

# Lint
npm run lint

# Type check
npm run typecheck

# Run E2E tests (starts dev server automatically)
npx playwright test

# E2E with interactive UI
npx playwright test --ui

# Install Playwright browsers (first time only)
npx playwright install
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── auth/          # Auth service, providers, role gates, SSO
├── components/    # Shared UI components
├── data/          # Seed data (species, parks, trails, routes)
├── hooks/         # React hooks
├── layouts/       # Layout components
├── map/           # Leaflet map components
├── offline/       # IndexedDB wrapper and sync queue
├── services/      # Business logic (scoring, privacy, membership)
├── styles/        # Global CSS
└── types/         # TypeScript type definitions

tests/
├── e2e/           # Playwright E2E tests
└── unit/          # Vitest unit + integration tests
```

## Offline Development

The PWA Service Worker is **disabled in development** (`next.config.mjs`):
```js
disable: process.env.NODE_ENV === "development"
```

To test offline behavior:
1. Run a production build: `npm run build && npm start`
2. Open the app and navigate to key pages (to populate caches)
3. Go offline (browser DevTools → Network → Offline)
4. Verify Field Guide, trips, and maps work from cache

## Validation Checklist

Before submitting changes, verify:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] No "safe to eat" or "confirmed edible" language anywhere
- [ ] Toxic lookalikes shown before edible notes
- [ ] New features work offline (if applicable)
- [ ] Mobile layout works on small viewports
- [ ] Accessibility: proper labels, contrast, keyboard navigation

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable production-ready branch |
| `spec/*` | Spec and documentation updates |
| `feature/*` | Feature implementation |
| `fix/*` | Bug fixes |
| `security/*` | Authentication and security changes |

## Troubleshooting

### PocketBase Connection Failed
- Verify PocketBase is running: `curl http://127.0.0.1:8090/api/health`
- Check `NEXT_PUBLIC_POCKETBASE_URL` in `.env.local`

### SSO Redirect Loop
- Verify redirect URIs match exactly in provider settings and PocketBase
- Check browser console for OAuth errors

### Service Worker Issues
- Clear browser cache and service worker registration
- In Chrome DevTools: Application → Service Workers → Unregister
- Service Worker is disabled in development mode

### IndexedDB Issues
- Clear IndexedDB in browser DevTools: Application → IndexedDB → forageflow → Delete
- The database will be recreated and re-seeded on next page load

### Stripe Webhook Not Received
- Verify Stripe CLI is running and forwarding to the correct port
- Check that `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check server logs for signature verification errors
