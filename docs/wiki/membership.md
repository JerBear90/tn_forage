# ForageWise Membership System

## Overview

ForageWise uses a role-based membership system with Stripe as the source of truth for paid access. The frontend displays cached membership data but cannot grant or modify membership directly.

## Roles

| Role | Weight | Access |
|------|--------|--------|
| `guest` | 0 | Public pages only |
| `free` | 1 | Field Guide, basic map, trips/logs, limited AI |
| `member` | 2 | Extended offline packs, advanced filters, higher AI limits, cloud sync, premium trip tools |
| `super_user` | 3 | Admin dashboard, content moderation, safety notices, species editor, community moderation |

### Role Hierarchy (`src/auth/roleHierarchy.ts`)
Roles are compared numerically: `guest < free < member < super_user`. The `hasRequiredRole(userRole, requiredRole)` function checks if a user's role meets or exceeds the required level.

## Membership Plans

| Plan | Weight | Description |
|------|--------|-------------|
| `free` | 0 | Default plan for all users |
| `monthly` | 1 | Monthly paid membership |
| `yearly` | 2 | Annual paid membership |
| `lifetime` | 3 | One-time lifetime membership |
| `admin` | 4 | Manually assigned admin plan |

### Plan Hierarchy (`src/services/membershipPlanHierarchy.ts`)
Plans are compared numerically: `free < monthly < yearly < lifetime < admin`. The `hasRequiredPlan(userPlan, requiredPlan)` function checks plan access.

## PocketBase User Fields

```json
{
  "role": "guest | free | member | super_user",
  "membershipPlan": "free | monthly | yearly | lifetime | admin",
  "membershipStatus": "inactive | active | trialing | past_due | canceled",
  "stripeCustomerId": "cus_...",
  "subscriptionId": "sub_...",
  "currentPeriodEnd": "2025-07-15T00:00:00Z",
  "membershipLastVerifiedAt": "2025-06-15T12:00:00Z"
}
```

## UI Components

### MembershipGate (`src/components/MembershipGate.tsx`)
Restricts premium features based on membership plan:
```tsx
<MembershipGate requiredPlan="monthly">
  <PremiumFeature />
</MembershipGate>
```
- Shows a loading spinner while auth restores
- Shows an upgrade prompt with link to `/membership` if plan is insufficient
- Works offline using cached membership from IndexedDB

### RoleGate (`src/auth/RoleGate.tsx`)
Restricts content based on user role:
```tsx
<RoleGate requiredRole="member">
  <MemberContent />
</RoleGate>
```

### SuperUserGate (`src/auth/SuperUserGate.tsx`)
Convenience wrapper for super_user-only content:
```tsx
<SuperUserGate>
  <AdminPanel />
</SuperUserGate>
```

## Stripe Integration

### Checkout Flow
1. User visits `/membership` and clicks Upgrade
2. Frontend calls `/api/stripe/checkout` to create a Checkout Session
3. User is redirected to Stripe's hosted checkout page
4. After payment, Stripe sends webhook events
5. Webhook handler verifies signature and updates PocketBase user
6. Frontend refreshes membership status on next load

### Webhook Handler (`src/app/api/stripe/webhook/route.ts`)
Server-side only. Handles these Stripe events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set role to `member`, plan to selected, status to `active` |
| `customer.subscription.created` | Update plan and status based on subscription |
| `customer.subscription.updated` | Update plan, status, and period end |
| `customer.subscription.deleted` | Downgrade to `free` role, set status to `canceled` |
| `invoice.payment_succeeded` | Confirm `active` status |
| `invoice.payment_failed` | Set status to `past_due` |

### Security
- Webhook signature is verified using HMAC-SHA256 with timing-safe comparison
- Timestamp tolerance: 5 minutes
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only environment variables
- Membership is never granted from frontend code

## Offline Membership Display

Membership status is cached in IndexedDB (`membershipLocal` store) after each successful auth. When offline, the app displays the cached plan and status. Actual access enforcement happens server-side on API calls.
