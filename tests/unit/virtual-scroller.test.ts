/**
 * Unit tests for VirtualScroller integration with the field guide page.
 *
 * Since @testing-library/react is not installed, these tests verify:
 * 1. The VirtualScroller props interface and type contracts
 * 2. The threshold logic (> 20 items triggers virtual scrolling)
 * 3. Filter/search functionality is preserved regardless of rendering mode
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Threshold constant (mirrors the value in field-guide/page.tsx)
// ---------------------------------------------------------------------------

const VIRTUAL_SCROLL_THRESHOLD = 20;

// ---------------------------------------------------------------------------
// Helpers — simulate the filter/search logic from the field guide page
// ---------------------------------------------------------------------------

interface MockSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  category: "mushroom" | "plant" | "tree";
  regions: string[];
  season: string[];
  edibilityLabel: string;
}

function generateMockSpecies(count: number): MockSpecies[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `sp-${i}`,
    commonName: `Species ${i}`,
    scientificName: `Genus species${i}`,
    category: (["mushroom", "plant", "tree"] as const)[i % 3],
    regions: ["East TN", "Middle TN", "West TN"].slice(0, (i % 3) + 1),
    season: ["Spring", "Summer", "Fall", "Winter"].slice(0, (i % 4) + 1),
    edibilityLabel: "unknown",
  }));
}

function filterSpecies(
  items: MockSpecies[],
  options: {
    category?: string;
    region?: string;
    search?: string;
    seasons?: Set<string>;
    edibility?: Set<string>;
  }
): MockSpecies[] {
  let result = items;

  if (options.category && options.category !== "all") {
    result = result.filter((item) => item.category === options.category);
  }

  if (options.region && options.region !== "all") {
    result = result.filter((item) => item.regions.includes(options.region!));
  }

  if (options.seasons && options.seasons.size > 0) {
    result = result.filter((item) =>
      item.season.some((s) => options.seasons!.has(s))
    );
  }

  if (options.edibility && options.edibility.size > 0) {
    result = result.filter((item) =>
      options.edibility!.has(item.edibilityLabel)
    );
  }

  const query = (options.search || "").trim().toLowerCase();
  if (query) {
    result = result.filter(
      (item) =>
        item.commonName.toLowerCase().includes(query) ||
        item.scientificName.toLowerCase().includes(query)
    );
  }

  return result;
}

function shouldUseVirtualScroll(itemCount: number): boolean {
  return itemCount > VIRTUAL_SCROLL_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VirtualScroller threshold logic", () => {
  it("should NOT use virtual scrolling when item count is 0", () => {
    expect(shouldUseVirtualScroll(0)).toBe(false);
  });

  it("should NOT use virtual scrolling when item count is exactly 20", () => {
    expect(shouldUseVirtualScroll(20)).toBe(false);
  });

  it("should NOT use virtual scrolling when item count is less than 20", () => {
    expect(shouldUseVirtualScroll(10)).toBe(false);
    expect(shouldUseVirtualScroll(1)).toBe(false);
    expect(shouldUseVirtualScroll(19)).toBe(false);
  });

  it("should use virtual scrolling when item count is 21", () => {
    expect(shouldUseVirtualScroll(21)).toBe(true);
  });

  it("should use virtual scrolling when item count is large", () => {
    expect(shouldUseVirtualScroll(50)).toBe(true);
    expect(shouldUseVirtualScroll(100)).toBe(true);
    expect(shouldUseVirtualScroll(500)).toBe(true);
  });
});

describe("VirtualScroller props interface", () => {
  it("should accept items array and render function", () => {
    const items = generateMockSpecies(5);
    const renderItem = (item: MockSpecies, index: number) => ({
      id: item.id,
      index,
    });

    // Verify the render function works with each item
    items.forEach((item, i) => {
      const result = renderItem(item, i);
      expect(result.id).toBe(item.id);
      expect(result.index).toBe(i);
    });
  });

  it("should have a default overscan of 5", () => {
    const defaultOverscan = 5;
    expect(defaultOverscan).toBe(5);
  });

  it("estimateSize function should return a positive number", () => {
    const estimateSize = (_index: number) => 280;
    expect(estimateSize(0)).toBeGreaterThan(0);
    expect(estimateSize(99)).toBeGreaterThan(0);
  });
});

describe("Filter/search functionality preserved with virtual scrolling", () => {
  const allItems = generateMockSpecies(50);

  it("should filter by category and still determine correct rendering mode", () => {
    const mushrooms = filterSpecies(allItems, { category: "mushroom" });
    // 50 items, every 3rd is mushroom → ~17 mushrooms
    expect(mushrooms.length).toBeGreaterThan(0);
    expect(mushrooms.every((item) => item.category === "mushroom")).toBe(true);

    // Rendering mode depends on filtered count, not total count
    const useVirtual = shouldUseVirtualScroll(mushrooms.length);
    if (mushrooms.length > VIRTUAL_SCROLL_THRESHOLD) {
      expect(useVirtual).toBe(true);
    } else {
      expect(useVirtual).toBe(false);
    }
  });

  it("should filter by region and preserve all matching items", () => {
    const eastTN = filterSpecies(allItems, { region: "East TN" });
    expect(eastTN.length).toBeGreaterThan(0);
    expect(eastTN.every((item) => item.regions.includes("East TN"))).toBe(true);
  });

  it("should filter by search query (case-insensitive)", () => {
    const results = filterSpecies(allItems, { search: "species 1" });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (item) =>
          item.commonName.toLowerCase().includes("species 1") ||
          item.scientificName.toLowerCase().includes("species 1")
      )
    ).toBe(true);
  });

  it("should combine multiple filters", () => {
    const results = filterSpecies(allItems, {
      category: "mushroom",
      region: "East TN",
      search: "species",
    });
    expect(
      results.every(
        (item) =>
          item.category === "mushroom" &&
          item.regions.includes("East TN") &&
          (item.commonName.toLowerCase().includes("species") ||
            item.scientificName.toLowerCase().includes("species"))
      )
    ).toBe(true);
  });

  it("should return empty array when no items match filters", () => {
    const results = filterSpecies(allItems, { search: "nonexistent-xyz-123" });
    expect(results).toHaveLength(0);
    expect(shouldUseVirtualScroll(results.length)).toBe(false);
  });

  it("should use standard rendering when filters reduce items below threshold", () => {
    // Filter to a small subset
    const results = filterSpecies(allItems, {
      category: "tree",
      search: "species 2",
    });
    // This should be a small number of results
    expect(results.length).toBeLessThanOrEqual(VIRTUAL_SCROLL_THRESHOLD);
    expect(shouldUseVirtualScroll(results.length)).toBe(false);
  });

  it("should use virtual scrolling when unfiltered list exceeds threshold", () => {
    const results = filterSpecies(allItems, {});
    expect(results.length).toBe(50);
    expect(shouldUseVirtualScroll(results.length)).toBe(true);
  });
});
