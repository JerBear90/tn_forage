# ForageFlow Security + SSO Tasks

## Task 1: Audit Current Auth + Offline State
List current auth, IndexedDB, route guard, profile, and membership files.

## Task 2: Add Auth Service Layer
Support login, signup, logout, SSO start, SSO callback, session restore, online/offline state.

## Task 3: Add Auth Provider + Hook
Expose user, role, membership, authState, isOffline, login, signup, logout, startSSO, refreshSession.

## Task 4: Add Protected Routes + Role Gates
Allow offline authenticated users into offline-capable protected pages.

## Task 5: Add SSO UI
Add Google, Apple, Microsoft buttons. Disable when offline.

## Task 6: Add OAuth Callback Route
Handle provider return and save session.

## Task 7: Add Local Offline Profile Store
Store safe profile/membership metadata in IndexedDB.

## Task 8: Add Sync Queue Security Metadata
Tie queued records to user ownership.

## Task 9: Add Stripe Membership Backend Spec/Functions
Implement checkout, webhook, membership status.

## Task 10: Add Super User Role
Protect admin functions.

## Task 11: Add Security Copy + Privacy Notices
Add location/photo/membership notices.

## Task 12: Add Tests
Auth, SSO, offline reopen, role gate, membership gate, Stripe webhook, Super User, sync ownership.

## Task 13: Regression Test Offline Field Tools
Confirm Field Guide, maps, trips, logs, images still work offline.

## Task 14: Completion Report
List changed files, tests, known limitations, provider config needed.
