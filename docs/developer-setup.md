# Developer Setup Guide

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

## Environment Variables

ForageFlow uses three environment example files. Copy the appropriate one and fill in your values.

### Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Reference template with all variables |
| `.env.local.example` | Copy to `.env.local` for local development |
| `.env.sso.example` | SSO-specific variables (contains no secrets) |
| `.env.local` | Your local config (gitignored, never committed) |

### Public Variables (exposed to browser)

Variables prefixed with `NEXT_PUBLIC_` are included in the browser bundle:

```env
NEXT_PUBLIC_APP_NAME=ForageFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

### Server-Only Variables (never in browser)

Variables without the `NEXT_PUBLIC_` prefix are accessible only in API routes and server components:

```env
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

Do not commit `.env.local` to version control. It is gitignored by default.

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

On first run, PocketBase prompts you to create a super admin account at `http://127.0.0.1:8090/_/`. See [Admin Credentials](admin-credentials.md) for details on where credentials are stored.

### 4. Configure Users Collection

The `users` collection needs these additional fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `role` | Text | `free` | `guest`, `free`, `member`, `super_user` |
| `membershipPlan` | Text | `free` | `free`, `monthly`, `yearly`, `lifetime`, `admin` |
| `membershipStatus` | Text | `inactive` | `inactive`, `active`, `trialing`, `past_due`, `canceled` |
| `stripeCustomerId` | Text | — | Stripe customer ID |
| `subscriptionId` | Text | — | Stripe subscription ID |
| `currentPeriodEnd` | Date | — | Subscription period end |
| `membershipLastVerifiedAt` | Date | — | Last webhook verification timestamp |

### 5. Configure SSO Providers (Optional)

For Google, Apple, and Microsoft SSO, configure providers in the PocketBase admin panel under **Settings → Auth providers**. See [SSO Configuration](sso-configuration.md) for an overview and [SSO Provider Setup](security/sso-provider-setup.md) for detailed steps.

## Build Commands

```bash
# Start development server (hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Test Commands

```bash
# Run all unit and property-based tests (Vitest)
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests (Playwright)
npx playwright test

# Run E2E tests with interactive UI
npx playwright test --ui

# Install Playwright browsers (first time only)
npx playwright install
```

## Linting and Type Checking

```bash
# ESLint
npm run lint

# TypeScript type checking (no emit)
npm run typecheck
```

## Project Structure

```
src/
├── app/           # Next.js App Router pages and API routes
├── auth/          # Auth service, providers, role gates, SSO
├── components/    # Shared UI components
├── data/          # Seed data (species, parks, trails, challenges)
├── hooks/         # React hooks
├── map/           # Leaflet map components
├── offline/       # IndexedDB wrapper and sync queue
├── services/      # Business logic (scoring, privacy, membership)
├── styles/        # Global CSS
└── types/         # TypeScript type definitions

tests/
├── e2e/           # Playwright E2E tests
└── unit/          # Vitest unit + property-based tests

docs/              # Documentation
public/            # Static assets, PWA manifest, service worker
```

## Offline Development

The PWA Service Worker is disabled in development mode (`next.config.mjs`). To test offline behavior:

1. Run a production build: `npm run build && npm start`
2. Open the app and navigate to key pages (to populate caches)
3. Go offline (browser DevTools → Network → Offline)
4. Verify Field Guide, trips, and maps work from cache

## Validation Checklist

Before submitting changes:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] No "safe to eat" or "confirmed edible" language anywhere
- [ ] Toxic lookalikes shown before edible notes
- [ ] New features work offline (if applicable)
- [ ] Mobile layout works on small viewports
- [ ] Accessibility: proper labels, contrast, keyboard navigation

## Troubleshooting

### PocketBase Connection Failed
- Verify PocketBase is running: `curl http://127.0.0.1:8090/api/health`
- Check `NEXT_PUBLIC_POCKETBASE_URL` in `.env.local`

### IndexedDB Issues
- Clear IndexedDB in browser DevTools: Application → IndexedDB → forageflow → Delete
- The database will be recreated and re-seeded on next page load

### Service Worker Issues
- Clear browser cache and service worker registration
- In Chrome DevTools: Application → Service Workers → Unregister

### Stripe Webhook Not Received
- Verify Stripe CLI is running and forwarding to the correct port
- Check that `STRIPE_WEBHOOK_SECRET` matches the CLI output

## Related Documentation

- [What Is ForageFlow?](what-is-forageflow.md) — Project overview
- [Admin Credentials](admin-credentials.md) — PocketBase admin access
- [SSO Configuration](sso-configuration.md) — OAuth provider setup
- [Architecture](wiki/architecture.md) — System architecture and data flow
- [User Guide](user-guide.md) — Feature guide for end users
