# SSO Provider Setup Guide

ForageFlow uses redirect-based OAuth via PocketBase for SSO with Google, Apple, and Microsoft. This guide covers how to configure each provider.

## Prerequisites

- PocketBase instance running and accessible
- PocketBase admin access (http://127.0.0.1:8090/_/)
- A `users` collection configured in PocketBase

## Redirect URI

All providers use the same redirect URI:

```
https://your-domain.com/auth/callback
```

For local development:
```
http://localhost:3000/auth/callback
```

PocketBase also needs its own OAuth redirect configured. Check PocketBase docs for the exact format.

---

## Google

### 1. Create OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Name: `ForageFlow`

### 2. Configure Redirect URIs
Add these authorized redirect URIs:
```
http://localhost:3000/auth/callback          (development)
https://your-domain.com/auth/callback        (production)
http://127.0.0.1:8090/api/oauth2-redirect    (PocketBase redirect)
```

### 3. Configure PocketBase
1. Open PocketBase admin UI
2. Go to **Settings → Auth providers**
3. Enable **Google**
4. Enter your **Client ID** and **Client Secret**
5. Save

### 4. Test
- Test on desktop Chrome
- Test on mobile (iPhone Safari + Android Chrome)
- Test the redirect flow completes and returns to `/auth/callback`
- Verify user is created in PocketBase `users` collection

---

## Apple

### 1. Create Services ID
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Under **Identifiers**, click **+** and select **Services IDs**
4. Register a new Services ID:
   - Description: `ForageFlow`
   - Identifier: `com.forageflow.auth` (or your bundle ID)
5. Enable **Sign in with Apple**
6. Configure the **Return URLs**

### 2. Configure Redirect URIs
```
http://localhost:3000/auth/callback          (development)
https://your-domain.com/auth/callback        (production)
http://127.0.0.1:8090/api/oauth2-redirect    (PocketBase redirect)
```

### 3. Generate Private Key
1. In Apple Developer Portal, go to **Keys**
2. Create a new key with **Sign in with Apple** enabled
3. Download the `.p8` private key file
4. Note the **Key ID** and **Team ID**

### 4. Configure PocketBase
1. Open PocketBase admin UI
2. Go to **Settings → Auth providers**
3. Enable **Apple**
4. Enter your **Client ID** (Services ID identifier)
5. Enter the **Client Secret** (generated from the private key)
   - Apple requires a JWT-based client secret — see PocketBase docs for generation
6. Save

### 5. Test
- **Test on Safari** (Apple SSO works best on Safari)
- Test on iOS PWA mode
- Verify the redirect flow completes
- Note: Apple may not return the user's email on subsequent logins

---

## Microsoft

### 1. Register App in Azure
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory → App registrations**
3. Click **New registration**
4. Name: `ForageFlow`
5. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
6. Redirect URI: Web platform

### 2. Configure Redirect URIs
Add these redirect URIs under **Authentication**:
```
http://localhost:3000/auth/callback          (development)
https://your-domain.com/auth/callback        (production)
http://127.0.0.1:8090/api/oauth2-redirect    (PocketBase redirect)
```

### 3. Create Client Secret
1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set an expiration period
4. Copy the **Value** (not the Secret ID)

### 4. Configure PocketBase
1. Open PocketBase admin UI
2. Go to **Settings → Auth providers**
3. Enable **Microsoft**
4. Enter your **Application (client) ID**
5. Enter the **Client Secret** value
6. Save

### 5. Test
- Test on desktop and mobile browsers
- Test with both personal Microsoft accounts and organizational accounts
- Verify the callback processes correctly

---

## Security Reminders

- **Never commit provider secrets** to version control
- Store client secrets in PocketBase's admin settings (server-side only)
- Use `.env.sso.example` as a template — it intentionally does not contain secrets
- OAuth code verifiers are stored in `sessionStorage` (ephemeral, per-tab)
- No OAuth access tokens are stored in plain `localStorage`
- SSO buttons are automatically disabled when the device is offline
- First-time SSO login requires internet; previously authenticated users can use cached offline tools

## Troubleshooting

### Redirect Loop
- Verify the redirect URI matches exactly (including trailing slashes)
- Check that PocketBase's OAuth redirect is also configured

### "Provider not configured" Error
- Ensure the provider is enabled in PocketBase admin settings
- Verify client ID and secret are entered correctly

### Mobile Redirect Issues
- Use redirect-based OAuth (not popup) — ForageFlow is configured for this
- Test on actual mobile devices, not just browser dev tools
- Verify the callback page (`/auth/callback`) handles the response correctly

### Apple-Specific Issues
- Apple may not return email on subsequent logins — handle gracefully
- The client secret is a JWT that expires — regenerate periodically
- Test on Safari specifically (Apple SSO may behave differently on other browsers)
