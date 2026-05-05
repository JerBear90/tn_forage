/**
 * ForageWise — Auth Service
 *
 * Service module (not a React hook) that manages authentication state,
 * PocketBase integration, SSO redirect flows, and offline session restore.
 *
 * Auth states: unknown → guest | authenticated-online | authenticated-offline
 *              | session-expired | syncing | error
 *
 * First-time login requires internet. Previously authenticated users may
 * reopen offline and access cached field tools.
 */

import PocketBase from 'pocketbase';
import type {
  AuthState,
  AuthMetaLocal,
  UserProfileLocal,
  UserRole,
} from '@/types';
import { getDB } from '@/offline/db';

// ---------------------------------------------------------------------------
// PocketBase Client
// ---------------------------------------------------------------------------

const POCKETBASE_URL =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_POCKETBASE_URL
    ? process.env.NEXT_PUBLIC_POCKETBASE_URL
    : 'http://127.0.0.1:8090';

/** Singleton PocketBase client instance. */
export const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation so concurrent requests don't cancel each other
pb.autoCancellation(false);

// ---------------------------------------------------------------------------
// SSO Provider Type
// ---------------------------------------------------------------------------

/** Supported SSO providers for redirect-based OAuth. */
export type SSOProvider = 'google' | 'apple' | 'microsoft';

// ---------------------------------------------------------------------------
// Auth Result Types
// ---------------------------------------------------------------------------

/** Result returned by login and signup operations. */
export interface AuthResult {
  success: boolean;
  user?: UserProfileLocal;
  error?: string;
}

/** Result returned by SSO callback processing. */
export interface SSOCallbackParams {
  code: string;
  state: string;
  codeVerifier: string;
  provider: SSOProvider;
  redirectUrl: string;
}

// ---------------------------------------------------------------------------
// Internal State
// ---------------------------------------------------------------------------

/** Current auth state — starts as 'unknown' until restoreSession runs. */
let currentAuthState: AuthState = 'unknown';

/** Cached user profile for synchronous access. */
let cachedUser: UserProfileLocal | null = null;

/** Listeners notified on auth state changes. */
type AuthStateListener = (state: AuthState, user: UserProfileLocal | null) => void;
const listeners: Set<AuthStateListener> = new Set();

// ---------------------------------------------------------------------------
// State Machine Helpers
// ---------------------------------------------------------------------------

/**
 * Transition the auth state and notify listeners.
 * @param newState - The target auth state.
 * @param user - The user profile (null when transitioning to guest/error).
 */
function transitionState(
  newState: AuthState,
  user: UserProfileLocal | null = null,
): void {
  currentAuthState = newState;
  cachedUser = user;
  listeners.forEach((fn) => fn(newState, user));
}

// ---------------------------------------------------------------------------
// IndexedDB Persistence Helpers
// ---------------------------------------------------------------------------

/**
 * Persist user profile and auth metadata to IndexedDB.
 * Called after successful login, signup, or SSO callback.
 */
async function persistSession(
  user: UserProfileLocal,
  provider?: string,
): Promise<void> {
  const db = await getDB();
  await db.put('userProfileLocal', user);

  const authMeta: AuthMetaLocal = {
    id: `auth-${user.id}`,
    userId: user.id,
    authState: 'authenticated-online',
    offlineAccessAllowed: true,
    lastAuthenticatedAt: new Date().toISOString(),
    provider: provider ?? 'email',
  };
  await db.put('authMetaLocal', authMeta);
}

/**
 * Clear auth data from IndexedDB on logout.
 */
async function clearPersistedSession(): Promise<void> {
  const db = await getDB();
  await db.clear('authMetaLocal');
  // Keep userProfileLocal for potential offline display — clear it too for full logout
  await db.clear('userProfileLocal');
}

/**
 * Load cached auth metadata from IndexedDB.
 * Returns the first auth meta record found, or undefined.
 */
async function loadCachedAuthMeta(): Promise<AuthMetaLocal | undefined> {
  const db = await getDB();
  const all = await db.getAll('authMetaLocal');
  return all[0];
}

/**
 * Load cached user profile from IndexedDB.
 * Returns the first user profile record found, or undefined.
 */
async function loadCachedUserProfile(): Promise<UserProfileLocal | undefined> {
  const db = await getDB();
  const all = await db.getAll('userProfileLocal');
  return all[0];
}

// ---------------------------------------------------------------------------
// PocketBase Record → UserProfileLocal Mapper
// ---------------------------------------------------------------------------

/**
 * Map a PocketBase auth record to our local UserProfileLocal type.
 */
function mapPbUserToLocal(record: Record<string, unknown>): UserProfileLocal {
  return {
    id: record.id as string,
    email: (record.email as string) ?? '',
    displayName:
      (record.name as string) ??
      (record.displayName as string) ??
      (record.email as string) ??
      '',
    avatar: record.avatar ? String(record.avatar) : undefined,
    role: ((record.role as string) ?? 'free') as UserRole,
    createdAt: (record.created as string) ?? new Date().toISOString(),
    updatedAt: (record.updated as string) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Online Check
// ---------------------------------------------------------------------------

/**
 * Check if the browser is currently online.
 * Returns false during SSR or when navigator.onLine is false.
 */
function isOnline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Authenticate with email and password via PocketBase.
 *
 * Transitions to 'authenticated-online' on success.
 * Transitions to 'error' on failure.
 *
 * @param email - User email address.
 * @param password - User password.
 * @returns AuthResult with success status and user profile or error.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isOnline()) {
    return { success: false, error: 'Login requires an internet connection.' };
  }

  try {
    transitionState('syncing');
    const authData = await pb
      .collection('users')
      .authWithPassword(email, password);

    const user = mapPbUserToLocal(authData.record as unknown as Record<string, unknown>);
    await persistSession(user, 'email');
    transitionState('authenticated-online', user);

    return { success: true, user };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Login failed. Please try again.';
    transitionState('error');
    return { success: false, error: message };
  }
}

/**
 * Create a new account with email, password, and display name via PocketBase.
 *
 * After creation, automatically logs the user in.
 * Transitions to 'authenticated-online' on success.
 *
 * @param email - User email address.
 * @param password - User password (min 8 characters recommended).
 * @param displayName - User display name.
 * @returns AuthResult with success status and user profile or error.
 */
export async function signup(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  if (!isOnline()) {
    return { success: false, error: 'Signup requires an internet connection.' };
  }

  try {
    transitionState('syncing');

    // Create the user record
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name: displayName,
    });

    // Authenticate immediately after creation
    const authData = await pb
      .collection('users')
      .authWithPassword(email, password);

    const user = mapPbUserToLocal(authData.record as unknown as Record<string, unknown>);
    await persistSession(user, 'email');
    transitionState('authenticated-online', user);

    return { success: true, user };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Signup failed. Please try again.';
    transitionState('error');
    return { success: false, error: message };
  }
}

/**
 * Log out the current user.
 *
 * Clears PocketBase auth store, clears IndexedDB auth data,
 * and transitions to 'guest'.
 */
export async function logout(): Promise<void> {
  pb.authStore.clear();
  await clearPersistedSession();
  transitionState('guest', null);
}

/**
 * Initiate an SSO redirect flow for the given provider.
 *
 * Redirects the browser to PocketBase's OAuth endpoint.
 * The user will be redirected back to the app's callback URL after auth.
 *
 * @param provider - The SSO provider: 'google', 'apple', or 'microsoft'.
 * @throws Error if offline or if the provider is unsupported.
 */
export async function startSSO(provider: SSOProvider): Promise<void> {
  if (!isOnline()) {
    throw new Error('SSO login requires an internet connection.');
  }

  // Map our provider names to PocketBase OAuth2 provider names
  const providerMap: Record<SSOProvider, string> = {
    google: 'google',
    apple: 'apple',
    microsoft: 'microsoft',
  };

  const pbProvider = providerMap[provider];
  if (!pbProvider) {
    throw new Error(`Unsupported SSO provider: ${provider}`);
  }

  // Get the list of auth methods to find the provider's auth URL
  const authMethods = await pb.collection('users').listAuthMethods();
  const oauthProvider = authMethods.oauth2?.providers?.find(
    (p: { name: string }) => p.name === pbProvider,
  );

  if (!oauthProvider) {
    throw new Error(
      `SSO provider "${provider}" is not configured on the server.`,
    );
  }

  // Build the redirect URL — the callback page in our app
  const redirectUrl = `${window.location.origin}/auth/callback`;

  // Store the code verifier and provider in sessionStorage for the callback
  // sessionStorage is acceptable here — it's ephemeral and per-tab only
  sessionStorage.setItem('sso_code_verifier', oauthProvider.codeVerifier);
  sessionStorage.setItem('sso_state', oauthProvider.state);
  sessionStorage.setItem('sso_provider', provider);
  sessionStorage.setItem('sso_redirect_url', redirectUrl);

  // Redirect to the provider's authorization URL
  const authUrl = `${oauthProvider.authURL}${encodeURIComponent(redirectUrl)}`;
  window.location.href = authUrl;
}

/**
 * Process the OAuth callback after SSO redirect.
 *
 * Exchanges the authorization code for a session with PocketBase.
 * Transitions to 'authenticated-online' on success.
 *
 * @param params - The SSO callback parameters (code, state, codeVerifier, provider, redirectUrl).
 * @returns AuthResult with success status and user profile or error.
 */
export async function handleSSOCallback(
  params: SSOCallbackParams,
): Promise<AuthResult> {
  try {
    transitionState('syncing');

    const authData = await pb
      .collection('users')
      .authWithOAuth2Code(
        params.provider,
        params.code,
        params.codeVerifier,
        params.redirectUrl,
      );

    const user = mapPbUserToLocal(authData.record as unknown as Record<string, unknown>);
    await persistSession(user, params.provider);
    transitionState('authenticated-online', user);

    return { success: true, user };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'SSO authentication failed. Please try again.';
    transitionState('error');
    return { success: false, error: message };
  }
}

/**
 * Restore a previous session.
 *
 * - If online: validates the PocketBase auth store token, refreshes if needed.
 * - If offline: restores from IndexedDB if a valid cached session exists.
 * - If no session found: transitions to 'guest'.
 *
 * Should be called once on app startup.
 */
export async function restoreSession(): Promise<void> {
  try {
    if (isOnline()) {
      // Try to validate the existing PocketBase auth store
      if (pb.authStore.isValid) {
        try {
          const record = await pb.collection('users').authRefresh();
          const user = mapPbUserToLocal(record.record as unknown as Record<string, unknown>);
          await persistSession(user);
          transitionState('authenticated-online', user);
          return;
        } catch {
          // Token refresh failed — session expired
          pb.authStore.clear();
        }
      }

      // PocketBase store is empty or invalid — check IndexedDB
      const cachedMeta = await loadCachedAuthMeta();
      if (cachedMeta) {
        // We have cached auth but the token is gone/expired
        transitionState('session-expired');
        return;
      }

      // No session at all
      transitionState('guest');
    } else {
      // Offline — try to restore from IndexedDB
      const cachedMeta = await loadCachedAuthMeta();
      const cachedProfile = await loadCachedUserProfile();

      if (cachedMeta && cachedProfile && cachedMeta.offlineAccessAllowed) {
        transitionState('authenticated-offline', cachedProfile);
        return;
      }

      if (cachedMeta) {
        // Has auth meta but no profile or offline access not allowed
        transitionState('session-expired');
        return;
      }

      // No cached session
      transitionState('guest');
    }
  } catch {
    transitionState('error');
  }
}

/**
 * Get the current auth state.
 *
 * @returns The current AuthState value.
 */
export function getAuthState(): AuthState {
  return currentAuthState;
}

/**
 * Check if the user is currently authenticated (online or offline).
 *
 * @returns true if auth state is 'authenticated-online' or 'authenticated-offline'.
 */
export function isAuthenticated(): boolean {
  return (
    currentAuthState === 'authenticated-online' ||
    currentAuthState === 'authenticated-offline'
  );
}

/**
 * Get the cached user profile.
 *
 * @returns The current UserProfileLocal or null if not authenticated.
 */
export function getCurrentUser(): UserProfileLocal | null {
  return cachedUser;
}

// ---------------------------------------------------------------------------
// State Subscription (for React integration)
// ---------------------------------------------------------------------------

/**
 * Subscribe to auth state changes.
 *
 * @param listener - Callback invoked with (authState, user) on every transition.
 * @returns Unsubscribe function.
 */
export function onAuthStateChange(listener: AuthStateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Online/Offline Transition Handler
// ---------------------------------------------------------------------------

/**
 * Handle browser online/offline events to update auth state.
 *
 * - Going offline while authenticated-online → authenticated-offline
 * - Coming online while authenticated-offline → attempt session refresh
 *
 * Call `setupOnlineOfflineListener()` once on app startup.
 */
export function setupOnlineOfflineListener(): () => void {
  const handleOnline = async () => {
    if (currentAuthState === 'authenticated-offline') {
      // Try to refresh the session now that we're online
      try {
        if (pb.authStore.isValid) {
          const record = await pb.collection('users').authRefresh();
          const user = mapPbUserToLocal(record.record as unknown as Record<string, unknown>);
          await persistSession(user);
          transitionState('authenticated-online', user);
        } else {
          // Token is gone — try to restore from IndexedDB profile
          const cachedProfile = await loadCachedUserProfile();
          if (cachedProfile) {
            transitionState('session-expired', cachedProfile);
          } else {
            transitionState('session-expired');
          }
        }
      } catch {
        transitionState('session-expired');
      }
    }
  };

  const handleOffline = () => {
    if (currentAuthState === 'authenticated-online' && cachedUser) {
      transitionState('authenticated-offline', cachedUser);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {};
}

// ---------------------------------------------------------------------------
// Testing Helpers (exported for unit tests only)
// ---------------------------------------------------------------------------

/**
 * Reset internal auth state. For testing only.
 * @internal
 */
export function _resetForTesting(): void {
  currentAuthState = 'unknown';
  cachedUser = null;
  listeners.clear();
  pb.authStore.clear();
}
