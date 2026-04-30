# Stripe Membership Specification

## Overview

ForageFlow uses Stripe for payment processing. Stripe is the **server-authoritative source of truth** for membership status. The frontend displays cached membership data but cannot grant or modify paid access.

## Plans

| Plan | Stripe Interval | Role After Payment |
|------|----------------|-------------------|
| Free | — | `free` |
| Monthly Member | `month` | `member` |
| Yearly Member | `year` | `member` |
| Super User / Admin | Manually assigned | `super_user` |

## Checkout Flow

### Step-by-Step

1. **User visits `/membership`** and clicks an upgrade button
2. **Frontend calls `/api/stripe/checkout`** (POST) with the selected plan
3. **Server creates a Stripe Checkout Session** using `STRIPE_SECRET_KEY`
   - Sets `client_reference_id` to the user's PocketBase ID
   - Sets `metadata.userId` and `metadata.plan`
   - Configures success and cancel URLs
4. **Server returns the Checkout Session URL**
5. **User is redirected to Stripe's hosted checkout page**
6. **User completes payment on Stripe**
7. **Stripe sends webhook events** to `/api/stripe/webhook`
8. **Webhook handler verifies signature** and updates PocketBase user
9. **Frontend refreshes membership status** on next page load or auth refresh

### API Endpoint: `/api/stripe/checkout`

Location: `src/app/api/stripe/checkout/`

Creates a Stripe Checkout Session. Server-side only — uses `STRIPE_SECRET_KEY`.

## Webhook Handler

### Location
`src/app/api/stripe/webhook/route.ts`

### Signature Verification

The webhook handler verifies every incoming request:

1. Reads the raw request body (not parsed JSON)
2. Extracts the `stripe-signature` header
3. Parses the timestamp (`t=`) and signature (`v1=`) from the header
4. Verifies the timestamp is within 5 minutes (prevents replay attacks)
5. Computes HMAC-SHA256 of `{timestamp}.{payload}` using `STRIPE_WEBHOOK_SECRET`
6. Compares signatures using `crypto.timingSafeEqual` (prevents timing attacks)

If verification fails, the handler returns 401.

### Handled Events

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Sets role to `member`, plan to selected, status to `active`, stores Stripe customer/subscription IDs |
| `customer.subscription.created` | `handleSubscriptionEvent` | Updates plan and status based on subscription details |
| `customer.subscription.updated` | `handleSubscriptionEvent` | Updates plan, status, and `currentPeriodEnd` |
| `customer.subscription.deleted` | `handleSubscriptionEvent` | Downgrades to `free` role, sets status to `canceled` |
| `invoice.payment_succeeded` | `handleInvoicePaymentSucceeded` | Confirms `active` status, updates `membershipLastVerifiedAt` |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | Sets status to `past_due` |

### Plan Detection

The handler detects the plan from the Stripe subscription:
- Checks `items.data[0].price.recurring.interval`
- `year` → `yearly` plan
- `month` → `monthly` plan
- Falls back to `metadata.plan` if interval is not available

### Status Mapping

| Stripe Status | ForageFlow Status |
|--------------|-------------------|
| `active` | `active` |
| `trialing` | `trialing` |
| `past_due` | `past_due` |
| `canceled` | `canceled` |
| `unpaid` | `canceled` |
| `incomplete_expired` | `canceled` |
| Other | `inactive` |

### PocketBase Updates

The webhook handler authenticates with PocketBase using admin credentials and updates the user record:

```json
{
  "role": "member",
  "membershipPlan": "monthly",
  "membershipStatus": "active",
  "stripeCustomerId": "cus_...",
  "subscriptionId": "sub_...",
  "currentPeriodEnd": "2025-07-15T00:00:00Z",
  "membershipLastVerifiedAt": "2025-06-15T12:00:00Z"
}
```

### Error Handling

- Handler errors return 200 to prevent Stripe from retrying (errors are logged)
- Missing `userId` in event metadata logs a warning and skips the update
- PocketBase connection failures are logged but don't crash the handler
- Admin token is cached for ~2 hours with a 60-second refresh buffer

## Environment Variables

### Required for Stripe

```env
# Server-only (never exposed to browser):
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Public (safe for browser):
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Required for PocketBase Admin (webhook handler)

```env
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

## Security Rules

1. **Never grant membership from frontend code** — only Stripe webhooks update membership
2. **Never expose `STRIPE_SECRET_KEY`** — it's server-only
3. **Always verify webhook signatures** — reject unsigned or expired requests
4. **Use timing-safe comparison** — prevents signature timing attacks
5. **Validate timestamps** — 5-minute tolerance prevents replay attacks
6. **Log but don't crash** — return 200 even on handler errors to prevent Stripe retries

## Testing Webhooks Locally

Use the Stripe CLI to forward webhook events to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

The Stripe CLI will display a webhook signing secret (`whsec_...`) — use this as your `STRIPE_WEBHOOK_SECRET` for local development.

## Offline Behavior

- Stripe checkout is **online-only** (requires Stripe's hosted page)
- Cached membership status is displayed offline from IndexedDB
- Membership gate component (`MembershipGate`) uses cached data for offline UX
- Actual access enforcement happens server-side on API calls
