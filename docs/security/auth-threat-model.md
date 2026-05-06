# ForageWise Auth Threat Model

## Assets Under Protection

| Asset | Sensitivity | Storage |
|-------|------------|---------|
| User account credentials | High | PocketBase (server-side) |
| OAuth tokens | High | PocketBase auth store (memory + cookie), never plain localStorage |
| GPS location history | Medium | IndexedDB (local), PocketBase (synced) |
| Expedition photos | Medium | IndexedDB (local), PocketBase (synced) |
| Expedition logs | Medium | IndexedDB (local), PocketBase (synced) |
| Membership/payment status | High | PocketBase (server), Stripe (source of truth) |
| Super User privileges | High | PocketBase (server-validated) |
| Community posts | Low-Medium | PocketBase (server) |
| User profile data | Medium | IndexedDB (cached), PocketBase (server) |

## Threat Categories

### 1. Token Theft
**Risk**: Attacker steals auth token to impersonate user.
**Controls**:
- PocketBase tokens are stored in the SDK's auth store (memory + HTTP-only cookie)
- OAuth code verifiers use `sessionStorage` (ephemeral, per-tab, cleared on tab close)
- No OAuth access tokens in plain `localStorage`
- Session tokens have expiration (PocketBase default ~2 hours, refreshable)

### 2. Membership Spoofing
**Risk**: User modifies frontend to gain paid features without payment.
**Controls**:
- Stripe webhooks are the **sole source of truth** for membership changes
- Webhook signature verified with HMAC-SHA256 and timing-safe comparison
- Timestamp tolerance: 5 minutes (prevents replay attacks)
- Frontend displays cached membership but cannot grant access
- PocketBase collection rules enforce membership checks on API calls
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only environment variables

### 3. Role Escalation
**Risk**: User modifies frontend to access Super User tools.
**Controls**:
- `RoleGate` and `SuperUserGate` provide client-side UX gates
- **Server-side validation is the security boundary** — PocketBase validates roles on all API calls
- Super User role is manually assigned (not self-service)
- Admin routes (`/admin/*`) are protected by both client and server gates
- Role hierarchy is enforced numerically: `guest(0) < free(1) < member(2) < super_user(3)`

### 4. Offline Sync Tampering
**Risk**: Attacker modifies IndexedDB data to inject malicious content during sync.
**Controls**:
- Sync queue items include `payloadHash` (SHA-256) for integrity verification
- User ownership checks on sync operations (userId must match authenticated user)
- PocketBase validates record ownership on create/update/delete
- `clientVersion` field enables conflict detection

### 5. Sensitive GPS Exposure
**Risk**: User's exact foraging locations exposed publicly.
**Controls**:
- Expedition logs are **private by default**
- Public sharing requires explicit opt-in
- Public posts use GPS fuzzing (~1 km random offset via `locationPrivacy.ts`)
- Fuzzing uses uniform random distribution in ±0.01 degrees (lat/lng)
- Private posts retain exact coordinates (only visible to the owner)

### 6. Unsafe Community Advice
**Risk**: Community members post dangerous identification advice.
**Controls**:
- Community identification is explicitly labeled as "not expert confirmation"
- Community content **cannot override safety warnings**
- Flagging system for unsafe/incorrect content
- Super User moderation tools for content review
- Safety language rules enforced globally (no "safe to eat", "confirmed edible", etc.)
- Toxic lookalikes always shown before edible notes

### 7. XSS / Injection
**Risk**: Malicious content injected through user inputs.
**Controls**:
- React's built-in XSS protection (JSX escapes by default)
- Next.js server components don't expose raw HTML
- User-generated content rendered through React (not `dangerouslySetInnerHTML`)
- Input validation on forms

### 8. CSRF on Webhooks
**Risk**: Attacker sends fake webhook events to modify membership.
**Controls**:
- Stripe webhook signature verification (HMAC-SHA256)
- Timestamp validation (5-minute window)
- Constant-time signature comparison (prevents timing attacks)
- Webhook endpoint only accepts POST requests

## Environment Variable Security

### Public Variables (safe for browser)
```
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_POCKETBASE_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Server-Only Variables (never in browser bundle)
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
POCKETBASE_URL (internal server URL)
POCKETBASE_ADMIN_EMAIL
POCKETBASE_ADMIN_PASSWORD
```

These are only accessible in Next.js API routes and server components. The `NEXT_PUBLIC_` prefix is intentionally absent.

## Planned Improvements
- Account deletion/export support (GDPR compliance)
- Rate limiting on auth endpoints
- Audit logging for Super User actions
- Content Security Policy headers
- Subresource Integrity for external scripts
