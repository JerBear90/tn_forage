/**
 * Auth Service — Unit Tests
 *
 * Tests the auth state machine transitions, session persistence,
 * and online/offline behavior of the auth service module.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import 'fake-indexeddb/auto';

// ---------------------------------------------------------------------------
// Mock PocketBase before importing authService
// ---------------------------------------------------------------------------

const {
  mockAuthWithPassword,
  mockCreate,
  mockAuthRefresh,
  mockListAuthMethods,
  mockAuthWithOAuth2Code,
  mockAuthStoreClear,
  mockAuthStoreIsValid,
} = vi.hoisted(() => ({
  mockAuthWithPassword: vi.fn(),
  mockCreate: vi.fn(),
  mockAuthRefresh: vi.fn(),
  mockListAuthMethods: vi.fn(),
  mockAuthWithOAuth2Code: vi.fn(),
  mockAuthStoreClear: vi.fn(),
  mockAuthStoreIsValid: vi.fn(() => false),
}));

vi.mock('pocketbase', () => {
  function PocketBaseMock() {
    // @ts-expect-error - mock constructor
    this.autoCancellation = vi.fn();
    // @ts-expect-error - mock constructor
    this.collection = vi.fn(() => ({
      authWithPassword: mockAuthWithPassword,
      create: mockCreate,
      authRefresh: mockAuthRefresh,
      listAuthMethods: mockListAuthMethods,
      authWithOAuth2Code: mockAuthWithOAuth2Code,
    }));
    // @ts-expect-error - mock constructor
    this.authStore = {
      clear: mockAuthStoreClear,
      get isValid() {
        return mockAuthStoreIsValid();
      },
    };
  }
  return { default: PocketBaseMock };
});

// Import after mocks are set up
import {
  login,
  signup,
  logout,
  handleSSOCallback,
  restoreSession,
  getAuthState,
  isAuthenticated,
  getCurrentUser,
  onAuthStateChange,
  _resetForTesting,
  type SSOCallbackParams,
} from '@/auth/authService';
import { getDB } from '@/offline/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fake PocketBase user record */
function fakePbRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: '',
    role: 'free',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Set navigator.onLine for testing */
function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authService', () => {
  beforeEach(async () => {
    _resetForTesting();
    vi.clearAllMocks();
    setOnline(true);

    // Clear IndexedDB stores
    const db = await getDB();
    await db.clear('authMetaLocal');
    await db.clear('userProfileLocal');
  });

  // -----------------------------------------------------------------------
  // Initial State
  // -----------------------------------------------------------------------

  describe('initial state', () => {
    it('starts in "unknown" state', () => {
      expect(getAuthState()).toBe('unknown');
    });

    it('is not authenticated initially', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('has no current user initially', () => {
      expect(getCurrentUser()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------

  describe('login', () => {
    it('transitions to authenticated-online on successful login', async () => {
      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
      expect(getAuthState()).toBe('authenticated-online');
      expect(isAuthenticated()).toBe(true);
      expect(getCurrentUser()?.email).toBe('test@example.com');
    });

    it('transitions to error on failed login', async () => {
      mockAuthWithPassword.mockRejectedValueOnce(
        new Error('Invalid credentials'),
      );

      const result = await login('test@example.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(getAuthState()).toBe('error');
      expect(isAuthenticated()).toBe(false);
    });

    it('returns error when offline', async () => {
      setOnline(false);

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('internet connection');
      expect(mockAuthWithPassword).not.toHaveBeenCalled();
    });

    it('persists session to IndexedDB on successful login', async () => {
      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });

      await login('test@example.com', 'password123');

      const db = await getDB();
      const profiles = await db.getAll('userProfileLocal');
      const authMetas = await db.getAll('authMetaLocal');

      expect(profiles).toHaveLength(1);
      expect(profiles[0].email).toBe('test@example.com');
      expect(authMetas).toHaveLength(1);
      expect(authMetas[0].authState).toBe('authenticated-online');
      expect(authMetas[0].provider).toBe('email');
    });

    it('transitions through syncing state during login', async () => {
      const states: string[] = [];
      onAuthStateChange((state) => states.push(state));

      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });

      await login('test@example.com', 'password123');

      expect(states).toContain('syncing');
      expect(states).toContain('authenticated-online');
    });
  });

  // -----------------------------------------------------------------------
  // Signup
  // -----------------------------------------------------------------------

  describe('signup', () => {
    it('transitions to authenticated-online on successful signup', async () => {
      mockCreate.mockResolvedValueOnce(fakePbRecord());
      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord({ name: 'New User' }),
        token: 'test-token',
      });

      const result = await signup(
        'new@example.com',
        'password123',
        'New User',
      );

      expect(result.success).toBe(true);
      expect(getAuthState()).toBe('authenticated-online');
      expect(isAuthenticated()).toBe(true);
    });

    it('transitions to error on failed signup', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Email already exists'));

      const result = await signup(
        'existing@example.com',
        'password123',
        'User',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
      expect(getAuthState()).toBe('error');
    });

    it('returns error when offline', async () => {
      setOnline(false);

      const result = await signup('new@example.com', 'password123', 'User');

      expect(result.success).toBe(false);
      expect(result.error).toContain('internet connection');
    });
  });

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------

  describe('logout', () => {
    it('transitions to guest on logout', async () => {
      // First login
      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });
      await login('test@example.com', 'password123');
      expect(isAuthenticated()).toBe(true);

      // Then logout
      await logout();

      expect(getAuthState()).toBe('guest');
      expect(isAuthenticated()).toBe(false);
      expect(getCurrentUser()).toBeNull();
    });

    it('clears PocketBase auth store on logout', async () => {
      await logout();
      expect(mockAuthStoreClear).toHaveBeenCalled();
    });

    it('clears IndexedDB auth data on logout', async () => {
      // Persist some data first
      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });
      await login('test@example.com', 'password123');

      await logout();

      const db = await getDB();
      const profiles = await db.getAll('userProfileLocal');
      const authMetas = await db.getAll('authMetaLocal');

      expect(profiles).toHaveLength(0);
      expect(authMetas).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // SSO Callback
  // -----------------------------------------------------------------------

  describe('handleSSOCallback', () => {
    const ssoParams: SSOCallbackParams = {
      code: 'auth-code-123',
      state: 'state-abc',
      codeVerifier: 'verifier-xyz',
      provider: 'google',
      redirectUrl: 'http://localhost:3000/auth/callback',
    };

    it('transitions to authenticated-online on successful SSO', async () => {
      mockAuthWithOAuth2Code.mockResolvedValueOnce({
        record: fakePbRecord({ name: 'Google User' }),
        token: 'sso-token',
      });

      const result = await handleSSOCallback(ssoParams);

      expect(result.success).toBe(true);
      expect(getAuthState()).toBe('authenticated-online');
      expect(isAuthenticated()).toBe(true);
    });

    it('persists SSO provider in auth meta', async () => {
      mockAuthWithOAuth2Code.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'sso-token',
      });

      await handleSSOCallback(ssoParams);

      const db = await getDB();
      const authMetas = await db.getAll('authMetaLocal');
      expect(authMetas[0].provider).toBe('google');
    });

    it('transitions to error on failed SSO callback', async () => {
      mockAuthWithOAuth2Code.mockRejectedValueOnce(
        new Error('Invalid OAuth code'),
      );

      const result = await handleSSOCallback(ssoParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid OAuth code');
      expect(getAuthState()).toBe('error');
    });
  });

  // -----------------------------------------------------------------------
  // Restore Session
  // -----------------------------------------------------------------------

  describe('restoreSession', () => {
    it('transitions to guest when no session exists (online)', async () => {
      mockAuthStoreIsValid.mockReturnValue(false);

      await restoreSession();

      expect(getAuthState()).toBe('guest');
    });

    it('restores authenticated-online when PB token is valid', async () => {
      mockAuthStoreIsValid.mockReturnValue(true);
      mockAuthRefresh.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'refreshed-token',
      });

      await restoreSession();

      expect(getAuthState()).toBe('authenticated-online');
      expect(getCurrentUser()?.email).toBe('test@example.com');
    });

    it('transitions to session-expired when PB token refresh fails but cached meta exists', async () => {
      mockAuthStoreIsValid.mockReturnValue(true);
      mockAuthRefresh.mockRejectedValueOnce(new Error('Token expired'));

      // Put cached auth meta in IndexedDB
      const db = await getDB();
      await db.put('authMetaLocal', {
        id: 'auth-user-1',
        userId: 'user-1',
        authState: 'authenticated-online',
        offlineAccessAllowed: true,
        lastAuthenticatedAt: '2024-01-01T00:00:00Z',
        provider: 'email',
      });

      await restoreSession();

      expect(getAuthState()).toBe('session-expired');
    });

    it('restores authenticated-offline when offline with valid cached session', async () => {
      setOnline(false);

      const db = await getDB();
      await db.put('authMetaLocal', {
        id: 'auth-user-1',
        userId: 'user-1',
        authState: 'authenticated-online',
        offlineAccessAllowed: true,
        lastAuthenticatedAt: '2024-01-01T00:00:00Z',
        provider: 'email',
      });
      await db.put('userProfileLocal', {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'free' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });

      await restoreSession();

      expect(getAuthState()).toBe('authenticated-offline');
      expect(isAuthenticated()).toBe(true);
      expect(getCurrentUser()?.email).toBe('test@example.com');
    });

    it('transitions to guest when offline with no cached session', async () => {
      setOnline(false);

      await restoreSession();

      expect(getAuthState()).toBe('guest');
    });

    it('transitions to session-expired when offline with cached meta but no profile', async () => {
      setOnline(false);

      const db = await getDB();
      await db.put('authMetaLocal', {
        id: 'auth-user-1',
        userId: 'user-1',
        authState: 'authenticated-online',
        offlineAccessAllowed: true,
        lastAuthenticatedAt: '2024-01-01T00:00:00Z',
        provider: 'email',
      });

      await restoreSession();

      expect(getAuthState()).toBe('session-expired');
    });
  });

  // -----------------------------------------------------------------------
  // State Subscription
  // -----------------------------------------------------------------------

  describe('onAuthStateChange', () => {
    it('notifies listeners on state transitions', async () => {
      const states: string[] = [];
      const unsubscribe = onAuthStateChange((state) => states.push(state));

      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });

      await login('test@example.com', 'password123');

      expect(states).toEqual(['syncing', 'authenticated-online']);

      unsubscribe();
    });

    it('stops notifying after unsubscribe', async () => {
      const states: string[] = [];
      const unsubscribe = onAuthStateChange((state) => states.push(state));

      unsubscribe();

      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });
      await login('test@example.com', 'password123');

      expect(states).toHaveLength(0);
    });

    it('provides user profile in callback', async () => {
      let receivedUser: unknown = null;
      onAuthStateChange((_state, user) => {
        receivedUser = user;
      });

      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });

      await login('test@example.com', 'password123');

      expect(receivedUser).not.toBeNull();
      expect((receivedUser as { email: string }).email).toBe(
        'test@example.com',
      );
    });
  });

  // -----------------------------------------------------------------------
  // Auth State Machine — Full Lifecycle
  // -----------------------------------------------------------------------

  describe('auth state machine lifecycle', () => {
    it('follows unknown → syncing → authenticated-online → guest flow', async () => {
      const states: string[] = [getAuthState()];
      onAuthStateChange((state) => states.push(state));

      // Login
      mockAuthWithPassword.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: 'test-token',
      });
      await login('test@example.com', 'password123');

      // Logout
      await logout();

      expect(states).toEqual([
        'unknown',
        'syncing',
        'authenticated-online',
        'guest',
      ]);
    });

    it('follows unknown → syncing → error flow on failed login', async () => {
      const states: string[] = [getAuthState()];
      onAuthStateChange((state) => states.push(state));

      mockAuthWithPassword.mockRejectedValueOnce(new Error('Bad credentials'));
      await login('test@example.com', 'wrong');

      expect(states).toEqual(['unknown', 'syncing', 'error']);
    });
  });
});
