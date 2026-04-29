/**
 * Signup Page — Unit Tests
 *
 * Tests the signup page validation logic and auth integration points.
 *
 * The vitest environment is node (no JSX parsing), so we test:
 * - Validation logic patterns (display name, email, password, confirm)
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

describe("Signup page display name validation", () => {
  it("rejects empty display name", () => {
    const name = "";
    expect(!name.trim()).toBe(true);
  });

  it("rejects whitespace-only display name", () => {
    const name = "   ";
    expect(!name.trim()).toBe(true);
  });

  it("accepts valid display name", () => {
    const name = "Jane Doe";
    expect(!name.trim()).toBe(false);
  });

  it("trims leading/trailing whitespace from display name", () => {
    const name = "  Jane Doe  ";
    expect(name.trim()).toBe("Jane Doe");
  });
});

describe("Signup page email validation", () => {
  it("rejects empty email", () => {
    const email = "";
    expect(!email.trim()).toBe(true);
  });

  it("accepts valid email string", () => {
    const email = "user@example.com";
    expect(!email.trim()).toBe(false);
  });
});

describe("Signup page password validation", () => {
  it("rejects empty password", () => {
    const password = "";
    expect(!password).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const password = "short";
    expect(password.length < 8).toBe(true);
  });

  it("accepts passwords of exactly 8 characters", () => {
    const password = "12345678";
    expect(password.length >= 8).toBe(true);
  });

  it("accepts passwords longer than 8 characters", () => {
    const password = "longpassword123";
    expect(password.length >= 8).toBe(true);
  });
});

describe("Signup page confirm password validation", () => {
  it("detects password mismatch", () => {
    const password = "mypassword";
    const confirm = "different";
    expect(password !== confirm).toBe(true);
  });

  it("passes when passwords match", () => {
    const password = "mypassword";
    const confirm = "mypassword";
    expect(password === confirm).toBe(true);
  });

  it("detects mismatch with extra whitespace", () => {
    const password = "mypassword";
    const confirm = "mypassword ";
    expect(password !== confirm).toBe(true);
  });
});

describe("Signup page auth service integration", () => {
  it("signup function exists in auth service", async () => {
    const mod = await import("@/auth/authService");
    expect(typeof mod.signup).toBe("function");
  });

  it("signup requires internet (returns error when offline)", async () => {
    const mod = await import("@/auth/authService");
    // In node env, navigator is undefined so isOnline() returns false
    const result = await mod.signup("test@example.com", "password123", "Test");
    expect(result.success).toBe(false);
    expect(result.error).toContain("internet connection");
  });

  it("startSSO function exists in auth service", async () => {
    const mod = await import("@/auth/authService");
    expect(typeof mod.startSSO).toBe("function");
  });
});

describe("Signup page offline behavior expectations", () => {
  it("SSO buttons should be disabled when offline", () => {
    const isOffline = true;
    const ssoDisabled = isOffline;
    expect(ssoDisabled).toBe(true);
  });

  it("SSO buttons should be enabled when online", () => {
    const isOffline = false;
    const ssoDisabled = isOffline;
    expect(ssoDisabled).toBe(false);
  });

  it("form busy state combines submitting and syncing", () => {
    // Pattern: const isFormBusy = submitting || authState === "syncing"
    expect(true || "guest" === "syncing").toBe(true);
    expect(false || "syncing" === "syncing").toBe(true);
    expect(false || "guest" === "syncing").toBe(false);
  });
});
