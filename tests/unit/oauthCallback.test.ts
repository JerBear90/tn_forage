/**
 * OAuth Callback — Unit Tests
 *
 * Tests the OAuth callback page logic: parameter validation,
 * sessionStorage interaction, state matching, and cleanup.
 *
 * Since the project uses a Node vitest environment without jsdom or
 * @testing-library/react, we test the pure logic that drives the
 * callback page — parameter extraction, validation rules, and
 * integration with handleSSOCallback from authService.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";

// ---------------------------------------------------------------------------
// Mock PocketBase before importing authService
// ---------------------------------------------------------------------------

const { mockAuthWithOAuth2Code } = vi.hoisted(() => ({
  mockAuthWithOAuth2Code: vi.fn(),
}));

vi.mock("pocketbase", () => {
  function PocketBaseMock() {
    // @ts-expect-error - mock constructor
    this.autoCancellation = vi.fn();
    // @ts-expect-error - mock constructor
    this.collection = vi.fn(() => ({
      authWithPassword: vi.fn(),
      create: vi.fn(),
      authRefresh: vi.fn(),
      listAuthMethods: vi.fn(),
      authWithOAuth2Code: mockAuthWithOAuth2Code,
    }));
    // @ts-expect-error - mock constructor
    this.authStore = {
      clear: vi.fn(),
      get isValid() {
        return false;
      },
    };
  }
  return { default: PocketBaseMock };
});

import {
  handleSSOCallback,
  _resetForTesting,
  getAuthState,
  isAuthenticated,
  type SSOCallbackParams,
  type SSOProvider,
} from "@/auth/authService";
import { getDB } from "@/offline/db";

// ---------------------------------------------------------------------------
// Session storage keys (must match the callback page and authService.startSSO)
// ---------------------------------------------------------------------------

const SSO_KEYS = {
  codeVerifier: "sso_code_verifier",
  state: "sso_state",
  provider: "sso_provider",
  redirectUrl: "sso_redirect_url",
} as const;

// ---------------------------------------------------------------------------
// Mock sessionStorage for Node environment
// ---------------------------------------------------------------------------

const sessionStore: Record<string, string> = {};

const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStore).forEach((key) => delete sessionStore[key]);
  }),
  get length() {
    return Object.keys(sessionStore).length;
  },
  key: vi.fn((index: number) => Object.keys(sessionStore)[index] ?? null),
};

// Assign to global for Node environment
Object.defineProperty(globalThis, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakePbRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-sso-1",
    email: "sso@example.com",
    name: "SSO User",
    avatar: "",
    role: "free",
    created: "2024-01-01T00:00:00Z",
    updated: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    writable: true,
    configurable: true,
  });
}

/** Populate sessionStorage with valid SSO data as startSSO would */
function populateSessionStorage(overrides: Partial<Record<string, string>> = {}) {
  const defaults: Record<string, string> = {
    [SSO_KEYS.codeVerifier]: "test-verifier-abc123",
    [SSO_KEYS.state]: "test-state-xyz789",
    [SSO_KEYS.provider]: "google",
    [SSO_KEYS.redirectUrl]: "http://localhost:3000/auth/callback",
  };
  const data = { ...defaults, ...overrides };
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      sessionStore[key] = value;
    }
  });
}

/**
 * Simulate the callback page logic:
 * Extract params, validate, call handleSSOCallback, clean up.
 * Returns { success, error } to mirror what the page would display.
 */
async function simulateCallbackFlow(
  urlParams: { code?: string | null; state?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const code = urlParams.code ?? null;
  const state = urlParams.state ?? null;

  // Step 1: Validate URL params
  if (!code || !state) {
    cleanupSessionStorage();
    return {
      success: false,
      error: "Missing authorization parameters. The sign-in link may have expired.",
    };
  }

  // Step 2: Retrieve stored SSO data from sessionStorage
  const codeVerifier = sessionStorage.getItem(SSO_KEYS.codeVerifier);
  const storedState = sessionStorage.getItem(SSO_KEYS.state);
  const provider = sessionStorage.getItem(SSO_KEYS.provider);
  const redirectUrl = sessionStorage.getItem(SSO_KEYS.redirectUrl);

  if (!codeVerifier || !storedState || !provider || !redirectUrl) {
    cleanupSessionStorage();
    return {
      success: false,
      error: "Session data is missing. Your sign-in session may have expired. Please try again.",
    };
  }

  // Validate state matches (CSRF protection)
  if (state !== storedState) {
    cleanupSessionStorage();
    return {
      success: false,
      error: "Security validation failed. The sign-in state does not match. Please try again.",
    };
  }

  // Validate provider
  const validProviders: SSOProvider[] = ["google", "apple", "microsoft"];
  if (!validProviders.includes(provider as SSOProvider)) {
    cleanupSessionStorage();
    return {
      success: false,
      error: `Unsupported sign-in provider: ${provider}. Please try again.`,
    };
  }

  try {
    const result = await handleSSOCallback({
      code,
      state,
      codeVerifier,
      provider: provider as SSOProvider,
      redirectUrl,
    });

    cleanupSessionStorage();

    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  } catch (err: unknown) {
    cleanupSessionStorage();
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred during sign-in.";
    return { success: false, error: message };
  }
}

function cleanupSessionStorage() {
  sessionStorage.removeItem(SSO_KEYS.codeVerifier);
  sessionStorage.removeItem(SSO_KEYS.state);
  sessionStorage.removeItem(SSO_KEYS.provider);
  sessionStorage.removeItem(SSO_KEYS.redirectUrl);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OAuth Callback", () => {
  beforeEach(async () => {
    _resetForTesting();
    vi.clearAllMocks();
    mockSessionStorage.clear();
    setOnline(true);

    const db = await getDB();
    await db.clear("authMetaLocal");
    await db.clear("userProfileLocal");
  });

  // -----------------------------------------------------------------------
  // Successful SSO callback
  // -----------------------------------------------------------------------

  describe("successful callback", () => {
    it("completes SSO flow with valid params and session data", async () => {
      populateSessionStorage();
      mockAuthWithOAuth2Code.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: "sso-token",
      });

      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(true);
      expect(getAuthState()).toBe("authenticated-online");
      expect(isAuthenticated()).toBe(true);
    });

    it("works with all three SSO providers", async () => {
      const providers: SSOProvider[] = ["google", "apple", "microsoft"];

      for (const provider of providers) {
        _resetForTesting();
        mockSessionStorage.clear();
        populateSessionStorage({ [SSO_KEYS.provider]: provider });

        mockAuthWithOAuth2Code.mockResolvedValueOnce({
          record: fakePbRecord({ name: `${provider} User` }),
          token: `${provider}-token`,
        });

        const result = await simulateCallbackFlow({
          code: `code-${provider}`,
          state: "test-state-xyz789",
        });

        expect(result.success).toBe(true);
        expect(getAuthState()).toBe("authenticated-online");
      }
    });

    it("persists session to IndexedDB after successful SSO", async () => {
      populateSessionStorage();
      mockAuthWithOAuth2Code.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: "sso-token",
      });

      await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      const db = await getDB();
      const profiles = await db.getAll("userProfileLocal");
      const authMetas = await db.getAll("authMetaLocal");

      expect(profiles).toHaveLength(1);
      expect(profiles[0].email).toBe("sso@example.com");
      expect(authMetas).toHaveLength(1);
      expect(authMetas[0].provider).toBe("google");
    });
  });

  // -----------------------------------------------------------------------
  // Missing URL parameters
  // -----------------------------------------------------------------------

  describe("missing URL parameters", () => {
    it("returns error when code is missing", async () => {
      populateSessionStorage();

      const result = await simulateCallbackFlow({
        code: null,
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing authorization parameters");
    });

    it("returns error when state is missing", async () => {
      populateSessionStorage();

      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing authorization parameters");
    });

    it("returns error when both code and state are missing", async () => {
      populateSessionStorage();

      const result = await simulateCallbackFlow({
        code: null,
        state: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing authorization parameters");
    });
  });

  // -----------------------------------------------------------------------
  // Missing session storage data
  // -----------------------------------------------------------------------

  describe("missing session storage data", () => {
    it("returns error when codeVerifier is missing from sessionStorage", async () => {
      populateSessionStorage();
      delete sessionStore[SSO_KEYS.codeVerifier];

      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Session data is missing");
    });

    it("returns error when provider is missing from sessionStorage", async () => {
      populateSessionStorage();
      delete sessionStore[SSO_KEYS.provider];

      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Session data is missing");
    });

    it("returns error when sessionStorage is completely empty", async () => {
      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Session data is missing");
    });
  });

  // -----------------------------------------------------------------------
  // State mismatch (CSRF protection)
  // -----------------------------------------------------------------------

  describe("state validation", () => {
    it("returns error when URL state does not match stored state", async () => {
      populateSessionStorage();

      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: "wrong-state-value",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Security validation failed");
      expect(result.error).toContain("state does not match");
    });
  });

  // -----------------------------------------------------------------------
  // Invalid provider
  // -----------------------------------------------------------------------

  describe("provider validation", () => {
    it("returns error for unsupported provider", async () => {
      populateSessionStorage({ [SSO_KEYS.provider]: "facebook" });

      const result = await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported sign-in provider");
      expect(result.error).toContain("facebook");
    });
  });

  // -----------------------------------------------------------------------
  // PocketBase / handleSSOCallback failure
  // -----------------------------------------------------------------------

  describe("SSO callback failure", () => {
    it("returns error when PocketBase rejects the OAuth code", async () => {
      populateSessionStorage();
      mockAuthWithOAuth2Code.mockRejectedValueOnce(
        new Error("Invalid OAuth code")
      );

      const result = await simulateCallbackFlow({
        code: "expired-code",
        state: "test-state-xyz789",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid OAuth code");
      expect(getAuthState()).toBe("error");
    });
  });

  // -----------------------------------------------------------------------
  // Session storage cleanup
  // -----------------------------------------------------------------------

  describe("sessionStorage cleanup", () => {
    it("cleans up sessionStorage after successful callback", async () => {
      populateSessionStorage();
      mockAuthWithOAuth2Code.mockResolvedValueOnce({
        record: fakePbRecord(),
        token: "sso-token",
      });

      await simulateCallbackFlow({
        code: "auth-code-123",
        state: "test-state-xyz789",
      });

      expect(sessionStore[SSO_KEYS.codeVerifier]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.state]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.provider]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.redirectUrl]).toBeUndefined();
    });

    it("cleans up sessionStorage after failed callback", async () => {
      populateSessionStorage();
      mockAuthWithOAuth2Code.mockRejectedValueOnce(
        new Error("OAuth failed")
      );

      await simulateCallbackFlow({
        code: "bad-code",
        state: "test-state-xyz789",
      });

      expect(sessionStore[SSO_KEYS.codeVerifier]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.state]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.provider]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.redirectUrl]).toBeUndefined();
    });

    it("cleans up sessionStorage when URL params are missing", async () => {
      populateSessionStorage();

      await simulateCallbackFlow({ code: null, state: null });

      expect(sessionStore[SSO_KEYS.codeVerifier]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.state]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.provider]).toBeUndefined();
      expect(sessionStore[SSO_KEYS.redirectUrl]).toBeUndefined();
    });
  });
});
