# PocketBase Admin Credentials

## Overview

ForageWise uses PocketBase as its backend for authentication, data storage, and file management. PocketBase has its own admin panel that is separate from the ForageWise application.

## Admin Panel Access

The PocketBase admin panel is available at:

```
http://127.0.0.1:8090/_/
```

On first run, PocketBase prompts you to create a super admin account. This account is used to manage collections, configure OAuth providers, and administer the backend.

## Where Credentials Are Stored

Admin credentials are configured in two places:

1. **PocketBase internal database** — The super admin email and password are stored by PocketBase itself in its `pb_data` directory. These are not part of the ForageWise frontend codebase.

2. **Server-side environment variables** — For the Stripe webhook handler and other server-side operations that need PocketBase admin access, the admin email and password are referenced via environment variables. See the `.env.local.example` file for the variable names:
   - `POCKETBASE_ADMIN_EMAIL`
   - `POCKETBASE_ADMIN_PASSWORD`

## Important

- **Do not commit credentials** to version control. The `.env.local` file is gitignored.
- **Do not include credentials** in frontend code or frontend documentation. The values in `.env.local.example` are placeholders only.
- **Server-only variables** (without the `NEXT_PUBLIC_` prefix) are never included in the browser bundle. They are accessible only in API routes and server components.

## Resetting Admin Credentials

If you need to reset the PocketBase admin password, you can do so through the PocketBase admin panel or by deleting the `pb_data` directory and restarting PocketBase (this will reset all data).

## Related Documentation

- [Developer Setup Guide](developer-setup.md) — Full environment setup instructions
- [SSO Configuration](sso-configuration.md) — Configuring OAuth providers in PocketBase
