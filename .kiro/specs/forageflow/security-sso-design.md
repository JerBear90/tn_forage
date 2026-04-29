# ForageFlow Security + SSO Design

## Architecture
Online auth establishes identity. Offline local state preserves field access. Server validates all privileged sync actions later.

## Auth Files
```txt
src/auth/authService.ts
src/auth/AuthProvider.tsx
src/auth/useAuth.ts
src/auth/ProtectedRoute.tsx
src/auth/RoleGate.tsx
src/auth/oauthProviders.ts
src/auth/sessionStore.ts
```

## Auth State Machine
- unknown
- guest
- authenticated-online
- authenticated-offline
- session-expired
- syncing
- error

## Route Categories
Public:
- Home
- Login
- Signup
- Safety disclaimer
- Limited Field Guide preview

Auth Required:
- Trips
- Expedition logs
- Profile
- Saved maps

Membership Required:
- Premium filters
- Extended offline species packs
- Higher AI usage

Super User Required:
- Admin dashboard
- Moderation
- Species editor
- Safety notice editor

## SSO Flow
1. User taps provider
2. App saves intended path
3. Redirect to provider
4. Provider returns to callback
5. PocketBase validates
6. Session stored
7. User returned to path

## Offline Session Model
Local IndexedDB profile:
- userId
- displayName
- avatarThumb/localBlobId
- role
- membershipPlan
- membershipStatus
- membershipLastVerifiedAt
- lastSuccessfulLoginAt
- offlineAccessAllowed

Do not store provider access tokens in IndexedDB.
