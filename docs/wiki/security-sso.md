# ForageFlow Security & SSO

## Authentication Architecture

### Auth Service (`src/auth/authService.ts`)

The auth service manages all authentication state through a state machine:

```
unknown → guest
       → authenticated-online → authenticated-offline (on disconnect)
       → session-expired
       → syncing
       → error
```

### Auth States

| State | Description |
|-------|-------------|
| `unknown` | Initial state before session restore |
| `guest` | No authenticated session |
| `authenticated-online` | Active session with PocketBase connection |
| `authenticated-offline` | Previously authenticated, device is offline |
| `session-expired` | Token expired, needs re-authentication |
| `syncing` | Auth operation in progress |
| `error` | Auth operation failed |

### First-Time vs Returning Users
- **First-time login** requires internet (PocketBase authentication)
- **Previously authenticated users** can reopen the app offline and access cached field tools
- Session data is persisted to IndexedDB (`authMetaLocal` + `userProfileLocal` stores)

## SSO Providers

ForageFlow supports three SSO providers via PocketBase's OAuth2 integration:

| Provider | PocketBase Name | Notes |
|----------|----------------|-------|
| Google | `google` | Most common, works on all platforms |
| Apple | `apple` | Required for iOS App Store (if applicable), test on Safari |
| Microsoft | `microsoft` | Azure AD registration required |

### Redirect-Based OAuth Flow

ForageFlow uses redirect-based OAuth (not popup) for PWA and mobile reliability:

1. User clicks SSO button on `/login`
2. `authService.startSSO(provider)` is called
3. Code verifier, state, and provider are stored in `sessionStorage` (ephemeral, per-tab)
4. Browser redirects to provider's authorization URL
5. After auth, provider redirects back to `/auth/callback`
6. Callback page reads `sessionStorage` values and calls `authService.handleSSOCallback()`
7. PocketBase exchanges the authorization code for a session
8. User profile is persisted to IndexedDB

### SSO Button Behavior
- SSO buttons are **disabled when offline** (SSO requires internet)
- Each button shows the provider name and icon
- Buttons have accessible labels for screen readers

## Protected Routes

### ProtectedRoute (`src/auth/ProtectedRoute.tsx`)
Wraps pages that require authentication:
- Redirects to `/login` if user is not authenticated
- **Offline-aware**: allows access if user has a cached offline session
- Shows loading state while auth is restoring

### RoleGate (`src/auth/RoleGate.tsx`)
Restricts content by role hierarchy:
- `guest < free < member < super_user`
- Shows "Not authorized" fallback if role is insufficient
- Works offline using cached role from IndexedDB

### SuperUserGate (`src/auth/SuperUserGate.tsx`)
Convenience wrapper that requires `super_user` role:
- Client-side UX gate only
- **Server-side validation is also required** — PocketBase validates roles on all API calls
- Even if the frontend gate is bypassed, unauthorized actions are blocked server-side

## Security Controls

### Token Storage
- PocketBase auth tokens are stored in the PocketBase SDK's auth store (memory + cookie)
- OAuth code verifiers are stored in `sessionStorage` (ephemeral, per-tab only)
- User profile and auth metadata are cached in IndexedDB for offline restore
- **No OAuth access tokens are stored in plain localStorage**

### Server-Side Validation
- All role checks are enforced server-side via PocketBase collection rules
- Super User actions require server-side role validation
- Stripe webhook signature verification uses HMAC-SHA256 with timing-safe comparison
- User ownership checks on sync operations

### Location Privacy
- Expedition logs are **private by default**
- Public posts use GPS fuzzing (~1 km offset via `src/services/locationPrivacy.ts`)
- Users must explicitly opt-in to public sharing

### Stripe Security
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only
- Webhook signature is verified before processing any event
- Timestamp tolerance: 5 minutes (prevents replay attacks)
- Membership is never granted from frontend code

### Content Safety
- Community content cannot override safety warnings
- Community identification is not expert confirmation
- Flagging system for unsafe/incorrect content
- Super User moderation tools for content review

## Environment Variables

### Public (exposed to browser)
```env
NEXT_PUBLIC_APP_NAME=ForageFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Server-Only (never exposed to browser)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=...
```

See `.env.example`, `.env.local.example`, and `.env.sso.example` for templates.
