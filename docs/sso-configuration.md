# SSO Configuration

## Overview

ForageWise supports Single Sign-On (SSO) with Google, Apple, and Microsoft via PocketBase's built-in OAuth2 integration. All SSO credentials are configured in the PocketBase admin panel — no OAuth secrets are stored in the frontend codebase.

## Where SSO Is Configured

SSO provider credentials (client IDs and client secrets) are configured in the **PocketBase admin panel**:

1. Open the PocketBase admin UI at `http://127.0.0.1:8090/_/`
2. Navigate to **Settings → Auth providers**
3. Enable the desired provider (Google, Apple, or Microsoft)
4. Enter the **Client ID** and **Client Secret** obtained from the provider's developer console
5. Save

Each provider requires its own developer account and OAuth application registration. The redirect URI for all providers is:

```
http://localhost:3000/auth/callback          (development)
https://your-domain.com/auth/callback        (production)
http://127.0.0.1:8090/api/oauth2-redirect    (PocketBase redirect)
```

## Detailed Provider Setup

For step-by-step instructions on registering OAuth applications with each provider (Google Cloud Console, Apple Developer Portal, Azure Portal), see:

**[docs/security/sso-provider-setup.md](security/sso-provider-setup.md)**

That guide covers:
- Creating OAuth client credentials for each provider
- Configuring redirect URIs
- Entering credentials in PocketBase
- Testing the SSO flow
- Troubleshooting common issues

## Security Notes

- **OAuth client secrets are stored server-side only** — in PocketBase's admin settings, not in frontend code.
- The `.env.sso.example` file is a template for SSO-related environment variables. It intentionally contains no secrets.
- OAuth code verifiers are stored in `sessionStorage` (ephemeral, per-tab). No OAuth access tokens are stored in plain `localStorage`.
- SSO buttons are automatically disabled when the device is offline, since SSO requires an internet connection.
- First-time SSO login requires internet. Previously authenticated users can access cached field tools offline.

## Related Documentation

- [SSO Provider Setup Guide](security/sso-provider-setup.md) — Detailed provider registration steps
- [Security & SSO Architecture](wiki/security-sso.md) — Authentication architecture and security controls
- [Admin Credentials](admin-credentials.md) — PocketBase admin panel access
