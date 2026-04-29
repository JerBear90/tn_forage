# ForageFlow Security + SSO Requirements

## Priority
Critical. Security and SSO must not weaken offline-first mobile behavior.

## Core Rule
Authentication and SSO require connectivity, but the app must remain usable offline after a successful prior login.

The app must support:
- Offline Field Guide
- Offline saved trips
- Offline expedition logs
- Offline cached map areas
- Offline local profile display
- Queued sync when online returns

---

## Supported Auth Methods
- Email/password through PocketBase
- Google SSO
- Apple SSO
- Microsoft SSO

Use redirect-based OAuth flows for mobile and PWA reliability.

---

## Offline Auth Behavior

### Online
Users may:
- Sign up
- Login
- Use SSO
- Refresh session
- Sync data
- Upgrade membership
- Update profile
- Upload avatar

### Offline
Users may:
- Open app if previously authenticated
- Use cached profile display
- Use Field Guide
- View species details
- Compare lookalikes
- View saved trips
- Add expedition logs
- Add photos locally
- Queue updates for sync

Users may not:
- First-time login
- Complete SSO
- Start Stripe checkout
- Access live community
- Run live AI unless queued

Message:
“This feature requires connection. Your offline field tools are still available.”

---

## Role Requirements
- Guest
- Free User
- Paid Member
- Super User

Super User permissions must be enforced server-side.

---

## Stripe Security
- Checkout session created server-side
- Webhooks verified
- Frontend never grants membership
- PocketBase stores membership state

---

## Privacy
The app collects:
- Email
- Profile name
- Optional avatar
- GPS for trips/logs
- Photos
- Species observations
- Membership status

GPS and uploaded images may contain sensitive location data. Public sharing must be opt-in.

---

## Acceptance Criteria
Complete only when:
- Email/password login works
- Google SSO works
- Apple/Microsoft scaffold documented
- Offline reopen works after prior login
- Protected routes do not crash offline
- Sync queue resumes online
- Role checks work
- Super User routes protected
- Stripe cannot be spoofed from frontend
