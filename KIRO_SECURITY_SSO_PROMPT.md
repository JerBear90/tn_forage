# Kiro Security + SSO Prompt

Implement security and SSO only after the offline app foundation works.

Rules:
- Preserve offline Field Guide, trips, logs, images, and cached maps.
- First-time auth requires internet.
- Previously authenticated users must reopen offline.
- Use redirect-based SSO.
- Do not store provider access tokens in plain localStorage.
- Do not trust frontend membership.
- Protect Super User routes server-side.

Return:
- Files changed
- Provider config needed
- Tests run
- Offline regression results
