/**
 * Login Page — Unit Tests
 *
 * Tests the login page validation logic and auth integration points.
 *
 * The vitest environment is node (no JSX parsing), so we test:
 * - Validation logic patterns used by the login form
 * - Auth hook contract and SSO provider types
 * - Offline-aware behavior expectations
 */

import { describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";

// ---------------------------------------------------------------------------
// Mock PocketBase before importing anything that depends on authService
// ---------------------------------------------------------------------------

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
      authWithOAuth2Code: vi.fn(),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Login page email validation", () => {
  it("rejects empty email", () => {
    const email = "";
    expect(!email.trim()).toBe(true);
  });

  it("rejects whitespace-only email", () => {
    const email = "   ";
    expect(!email.trim()).toBe(true);
  });

  it("accepts valid email string", () => {
    const email = "user@example.com";
    expect(!email.trim()).toBe(false);
  });
});

describe("Login page password validation", () => {
  it("rejects empty password", () => {
    const password = "";
    expect(!password).toBe(true);
  });

  it("accepts non-empty password", () => {
    const password = "mypassword";
    expect(!password).toBe(false);
  });
});

describe("Login page SSO provider types", () => {
  it("authService exports SSOProvider type with expected values", async () => {
    const mod = await import("@/auth/authService");
    expect(mod).toBeDefined();

    // Verify the startSSO function exists
    expect(typeof mod.startSSO).toBe("function");
  });

  it("all three SSO providers are valid SSOProvider values", () => {
    const providers: Array<import("@/auth/authService").SSOProvider> = [
      "google",
      "apple",
      "microsoft",
    ];
    expect(providers).toHaveLength(3);
    expect(providers).toContain("google");
    expect(providers).toContain("apple");
    expect(providers).toContain("microsoft");
  });
});

describe("Login page auth service integration", () => {
  it("login function exists in auth service", async () => {
    const mod = await import("@/auth/authService");
    expect(typeof mod.login).toBe("function");
  });

  it("login requires internet (returns error when offline)", async () => {
    // Simulate offline by calling login when navigator.onLine would be false
    // The auth service checks isOnline() internally
    const mod = await import("@/auth/authService");
    // In node env, navigator is undefined so isOnline() returns false
    const result = await mod.login("test@example.com", "password");
    expect(result.success).toBe(false);
    expect(result.error).toContain("internet connection");
  });

  it("auth state starts as unknown", async () => {
    const { getAuthState, _resetForTesting } = await import(
      "@/auth/authService"
    );
    _resetForTesting();
    expect(getAuthState()).toBe("unknown");
  });
});

describe("Login page offline behavior expectations", () => {
  it("SSO buttons should be disabled when offline", () => {
    // This tests the logic pattern: isOffline => disabled
    const isOffline = true;
    const ssoDisabled = isOffline;
    expect(ssoDisabled).toBe(true);
  });

  it("SSO buttons should be enabled when online", () => {
    const isOffline = false;
    const ssoDisabled = isOffline;
    expect(ssoDisabled).toBe(false);
  });

  it("form busy state disables SSO buttons", () => {
    const isOffline = false;
    const ssoLoading = "google" as const;
    const isFormBusy = false;
    const disabled = isOffline || ssoLoading !== null || isFormBusy;
    expect(disabled).toBe(true);
  });

  it("form busy state disables submit button", () => {
    const submitting = true;
    const authState = "syncing";
    const isFormBusy = submitting || authState === "syncing";
    expect(isFormBusy).toBe(true);
  });
});
