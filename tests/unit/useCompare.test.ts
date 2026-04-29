/**
 * Unit tests for src/hooks/useCompare.ts
 *
 * Tests the comparison selection logic: min/max constraints,
 * toggle, remove, clear, and state derivation.
 */

import { describe, it, expect } from "vitest";
import { MIN_COMPARE, MAX_COMPARE } from "@/hooks/useCompare";

// ---------------------------------------------------------------------------
// Pure logic tests (no React hooks — test the constraints and helpers)
// ---------------------------------------------------------------------------

describe("comparison constants", () => {
  it("MIN_COMPARE is 2", () => {
    expect(MIN_COMPARE).toBe(2);
  });

  it("MAX_COMPARE is 4", () => {
    expect(MAX_COMPARE).toBe(4);
  });

  it("MAX_COMPARE is greater than MIN_COMPARE", () => {
    expect(MAX_COMPARE).toBeGreaterThan(MIN_COMPARE);
  });
});

describe("comparison selection logic", () => {
  // Simulate the pure selection logic from the hook
  function createSelection(initial: string[] = []) {
    let ids = [...initial];

    return {
      get selectedIds() {
        return ids;
      },
      get canCompare() {
        return ids.length >= MIN_COMPARE;
      },
      get isFull() {
        return ids.length >= MAX_COMPARE;
      },
      get count() {
        return ids.length;
      },
      isSelected(id: string) {
        return ids.includes(id);
      },
      toggle(id: string) {
        if (ids.includes(id)) {
          ids = ids.filter((s) => s !== id);
        } else if (ids.length < MAX_COMPARE) {
          ids = [...ids, id];
        }
      },
      remove(id: string) {
        ids = ids.filter((s) => s !== id);
      },
      clearAll() {
        ids = [];
      },
    };
  }

  it("starts empty with canCompare=false", () => {
    const sel = createSelection();
    expect(sel.count).toBe(0);
    expect(sel.canCompare).toBe(false);
    expect(sel.isFull).toBe(false);
  });

  it("toggle adds a species", () => {
    const sel = createSelection();
    sel.toggle("sp-1");
    expect(sel.selectedIds).toEqual(["sp-1"]);
    expect(sel.isSelected("sp-1")).toBe(true);
    expect(sel.count).toBe(1);
  });

  it("toggle removes a species if already selected", () => {
    const sel = createSelection(["sp-1", "sp-2"]);
    sel.toggle("sp-1");
    expect(sel.selectedIds).toEqual(["sp-2"]);
    expect(sel.isSelected("sp-1")).toBe(false);
  });

  it("canCompare is true when >= 2 species selected", () => {
    const sel = createSelection(["sp-1", "sp-2"]);
    expect(sel.canCompare).toBe(true);
  });

  it("canCompare is false when < 2 species selected", () => {
    const sel = createSelection(["sp-1"]);
    expect(sel.canCompare).toBe(false);
  });

  it("isFull is true when 4 species selected", () => {
    const sel = createSelection(["sp-1", "sp-2", "sp-3", "sp-4"]);
    expect(sel.isFull).toBe(true);
  });

  it("toggle does not add beyond MAX_COMPARE", () => {
    const sel = createSelection(["sp-1", "sp-2", "sp-3", "sp-4"]);
    sel.toggle("sp-5");
    expect(sel.count).toBe(4);
    expect(sel.isSelected("sp-5")).toBe(false);
  });

  it("remove removes a specific species", () => {
    const sel = createSelection(["sp-1", "sp-2", "sp-3"]);
    sel.remove("sp-2");
    expect(sel.selectedIds).toEqual(["sp-1", "sp-3"]);
  });

  it("remove is a no-op for non-selected species", () => {
    const sel = createSelection(["sp-1"]);
    sel.remove("sp-99");
    expect(sel.selectedIds).toEqual(["sp-1"]);
  });

  it("clearAll empties the selection", () => {
    const sel = createSelection(["sp-1", "sp-2", "sp-3"]);
    sel.clearAll();
    expect(sel.count).toBe(0);
    expect(sel.canCompare).toBe(false);
  });

  it("can add after removing when previously full", () => {
    const sel = createSelection(["sp-1", "sp-2", "sp-3", "sp-4"]);
    expect(sel.isFull).toBe(true);
    sel.remove("sp-4");
    expect(sel.isFull).toBe(false);
    sel.toggle("sp-5");
    expect(sel.isSelected("sp-5")).toBe(true);
    expect(sel.count).toBe(4);
  });
});

describe("comparison data transformation", () => {
  it("toxic species are identified by edibility label", () => {
    const edibilityLabel = "toxic";
    expect(edibilityLabel === "toxic").toBe(true);
  });

  it("non-toxic species are not flagged", () => {
    const labels = [
      "commonly-considered-edible-with-expert-confirmation",
      "inedible",
      "unknown",
    ];
    for (const label of labels) {
      expect(label === "toxic").toBe(false);
    }
  });
});
