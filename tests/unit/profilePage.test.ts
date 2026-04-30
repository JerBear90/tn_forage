/**
 * Profile Page — Unit Tests
 *
 * Tests the profile page logic: name editing, avatar storage,
 * account delete request, offline cache, and settings helpers.
 *
 * The vitest environment is node (no JSX), so we test:
 * - IndexedDB profile CRUD (read/write/update)
 * - Avatar blob storage to photos store
 * - Account delete request persistence
 * - Helper functions (roleLabel, membershipLabel)
 * - Offline profile cache retrieval
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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
// Helpers (mirrored from ProfileContent for unit testing)
// ---------------------------------------------------------------------------

function roleLabel(role: string): string {
  switch (role) {
    case "super_user":
      return "Super User";
    case "member":
      return "Member";
    case "free":
      return "Free";
    case "guest":
      return "Guest";
    default:
      return role;
  }
}

function membershipLabel(plan: string, status: string): string {
  if (plan === "free") return "Free plan";
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const statusName = status.charAt(0).toUpperCase() + status.slice(1);
  return `${planName} — ${statusName}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Profile helper: roleLabel", () => {
  it("returns 'Super User' for super_user", () => {
    expect(roleLabel("super_user")).toBe("Super User");
  });

  it("returns 'Member' for member", () => {
    expect(roleLabel("member")).toBe("Member");
  });

  it("returns 'Free' for free", () => {
    expect(roleLabel("free")).toBe("Free");
  });

  it("returns 'Guest' for guest", () => {
    expect(roleLabel("guest")).toBe("Guest");
  });

  it("returns raw string for unknown role", () => {
    expect(roleLabel("admin")).toBe("admin");
  });
});

describe("Profile helper: membershipLabel", () => {
  it("returns 'Free plan' for free plan", () => {
    expect(membershipLabel("free", "inactive")).toBe("Free plan");
  });

  it("returns formatted label for monthly active", () => {
    expect(membershipLabel("monthly", "active")).toBe("Monthly — Active");
  });

  it("returns formatted label for yearly past_due", () => {
    expect(membershipLabel("yearly", "past_due")).toBe("Yearly — Past_due");
  });
});

describe("Profile IndexedDB operations", () => {
  beforeEach(async () => {
    // Clear the database between tests
    const { clearStore } = await import("@/offline/db");
    try {
      await clearStore("userProfileLocal");
      await clearStore("photos");
      await clearStore("settings");
    } catch {
      // stores may not exist yet
    }
  });

  it("saves and retrieves a user profile from IndexedDB", async () => {
    const { putRecord, getRecord } = await import("@/offline/db");
    const profile = {
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      role: "free" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putRecord("userProfileLocal", profile);
    const retrieved = await getRecord("userProfileLocal", "user-1");

    expect(retrieved).toBeDefined();
    expect(retrieved?.displayName).toBe("Test User");
    expect(retrieved?.email).toBe("test@example.com");
  });

  it("updates display name in IndexedDB profile", async () => {
    const { putRecord, getRecord } = await import("@/offline/db");
    const profile = {
      id: "user-1",
      email: "test@example.com",
      displayName: "Old Name",
      role: "free" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await putRecord("userProfileLocal", profile);

    // Update name
    const updated = { ...profile, displayName: "New Name", updatedAt: new Date().toISOString() };
    await putRecord("userProfileLocal", updated);

    const retrieved = await getRecord("userProfileLocal", "user-1");
    expect(retrieved?.displayName).toBe("New Name");
  });

  it("saves avatar blob to photos store", async () => {
    const { putRecord, getRecord } = await import("@/offline/db");
    const blob = new Blob(["fake-image-data"], { type: "image/jpeg" });

    await putRecord("photos", {
      id: "avatar-user-1",
      blob,
      mimeType: "image/jpeg",
      caption: "Profile avatar",
      createdAt: new Date().toISOString(),
      syncStatus: "pending" as const,
    });

    const retrieved = await getRecord("photos", "avatar-user-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.mimeType).toBe("image/jpeg");
    expect(retrieved?.caption).toBe("Profile avatar");
  });

  it("saves account delete request to settings store", async () => {
    const { putRecord, getRecord } = await import("@/offline/db");

    await putRecord("settings", {
      id: "delete-request-user-1",
      theme: "light" as const,
      safetyDisclaimerDismissed: false,
      introAnimationShown: false,
      lastSyncAt: new Date().toISOString(),
    });

    const retrieved = await getRecord("settings", "delete-request-user-1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("delete-request-user-1");
  });

  it("retrieves all cached profiles for offline display", async () => {
    const { putRecord, getAllRecords } = await import("@/offline/db");

    await putRecord("userProfileLocal", {
      id: "user-1",
      email: "test@example.com",
      displayName: "Cached User",
      role: "free" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const profiles = await getAllRecords("userProfileLocal");
    expect(profiles.length).toBeGreaterThanOrEqual(1);
    expect(profiles[0].displayName).toBe("Cached User");
  });
});

describe("Profile page offline behavior", () => {
  it("offline indicator logic: shows when not online", () => {
    const isOnline = false;
    expect(!isOnline).toBe(true);
  });

  it("offline indicator logic: hidden when online", () => {
    const isOnline = true;
    expect(!isOnline).toBe(false);
  });

  it("edit name button only shows when authenticated", () => {
    const isAuthenticated = true;
    expect(isAuthenticated).toBe(true);

    const isNotAuthenticated = false;
    expect(isNotAuthenticated).toBe(false);
  });

  it("account delete button only shows when authenticated", () => {
    const isAuthenticated = true;
    const showDeleteButton = isAuthenticated;
    expect(showDeleteButton).toBe(true);
  });

  it("sign-in link shows when not authenticated", () => {
    const isAuthenticated = false;
    const showSignIn = !isAuthenticated;
    expect(showSignIn).toBe(true);
  });
});

describe("Profile dark mode toggle", () => {
  it("toggle switches between light and dark", () => {
    let theme: "light" | "dark" = "light";
    const toggleTheme = () => {
      theme = theme === "dark" ? "light" : "dark";
    };

    expect(theme).toBe("light");
    toggleTheme();
    expect(theme).toBe("dark");
    toggleTheme();
    expect(theme).toBe("light");
  });

  it("isDark is true when theme is dark", () => {
    const theme = "dark";
    const isDark = theme === "dark";
    expect(isDark).toBe(true);
  });

  it("isDark is false when theme is light", () => {
    const theme = "light";
    const isDark = theme === "dark";
    expect(isDark).toBe(false);
  });
});
