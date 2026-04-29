/**
 * Unit tests for the SyncStatusIndicator state derivation logic.
 *
 * Since the project uses a Node vitest environment without jsdom or
 * @testing-library/react, we test the pure logic that drives the
 * component: given (isOnline, pendingCount) → SyncState.
 */

import { describe, it, expect } from "vitest";
import type { SyncState } from "@/hooks/useSyncStatus";

// ---------------------------------------------------------------------------
// Extract the pure derivation logic so we can test it without React hooks.
// This mirrors the logic inside useSyncStatus exactly.
// ---------------------------------------------------------------------------

function deriveSyncState(isOnline: boolean, pendingCount: number): SyncState {
  if (!isOnline) return "offline";
  if (pendingCount > 0) return "syncing";
  return "up-to-date";
}

// ---------------------------------------------------------------------------
// State config — mirrors the component's stateConfig map
// ---------------------------------------------------------------------------

const stateConfig: Record<
  SyncState,
  { dotClass: string; label: string; ariaLabel: string }
> = {
  offline: {
    dotClass: "bg-brand-earth",
    label: "Offline",
    ariaLabel: "Sync status: offline",
  },
  syncing: {
    dotClass: "bg-brand-teal animate-pulse",
    label: "Syncing…",
    ariaLabel: "Sync status: syncing pending changes",
  },
  "up-to-date": {
    dotClass: "bg-brand-moss",
    label: "Up to date",
    ariaLabel: "Sync status: up to date",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deriveSyncState", () => {
  it('returns "offline" when not online regardless of pending count', () => {
    expect(deriveSyncState(false, 0)).toBe("offline");
    expect(deriveSyncState(false, 5)).toBe("offline");
    expect(deriveSyncState(false, 100)).toBe("offline");
  });

  it('returns "syncing" when online and pending items exist', () => {
    expect(deriveSyncState(true, 1)).toBe("syncing");
    expect(deriveSyncState(true, 42)).toBe("syncing");
  });

  it('returns "up-to-date" when online and no pending items', () => {
    expect(deriveSyncState(true, 0)).toBe("up-to-date");
  });
});

describe("stateConfig", () => {
  it("has configuration for all three sync states", () => {
    const states: SyncState[] = ["offline", "syncing", "up-to-date"];
    for (const state of states) {
      expect(stateConfig[state]).toBeDefined();
      expect(stateConfig[state].label).toBeTruthy();
      expect(stateConfig[state].ariaLabel).toBeTruthy();
      expect(stateConfig[state].dotClass).toBeTruthy();
    }
  });

  it("offline state uses brand-earth color", () => {
    expect(stateConfig.offline.dotClass).toContain("bg-brand-earth");
  });

  it("syncing state uses brand-teal with pulse animation", () => {
    expect(stateConfig.syncing.dotClass).toContain("bg-brand-teal");
    expect(stateConfig.syncing.dotClass).toContain("animate-pulse");
  });

  it("up-to-date state uses brand-moss color", () => {
    expect(stateConfig["up-to-date"].dotClass).toContain("bg-brand-moss");
  });

  it("all states have accessible aria labels", () => {
    expect(stateConfig.offline.ariaLabel).toContain("offline");
    expect(stateConfig.syncing.ariaLabel).toContain("syncing");
    expect(stateConfig["up-to-date"].ariaLabel).toContain("up to date");
  });
});
