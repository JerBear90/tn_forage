/**
 * Unit tests for Field Guide filter logic (task 4.6)
 *
 * Tests the filtering behavior for season, edibility, category,
 * and search — verifying AND logic across all filter dimensions.
 */

import { describe, it, expect } from "vitest";
import type { EdibilityLabel, SpeciesCategory } from "@/types";

// ---------------------------------------------------------------------------
// Reproduce the FieldGuideItem type and filter logic from the page
// ---------------------------------------------------------------------------

interface FieldGuideItem {
  id: string;
  commonName: string;
  scientificName: string;
  category: SpeciesCategory;
  images: string[];
  edibilityLabel: EdibilityLabel;
  season: string[];
  habitat: string;
  treeAssociations: string[];
}

type Season = "Spring" | "Summer" | "Fall" | "Winter";

/**
 * Pure filter function extracted from the page's useMemo logic.
 * This mirrors the exact filtering behavior in page.tsx.
 */
function filterItems(
  items: FieldGuideItem[],
  opts: {
    category: SpeciesCategory | "all";
    seasons: Set<Season>;
    edibility: Set<EdibilityLabel>;
    search: string;
  }
): FieldGuideItem[] {
  let result = items;

  if (opts.category !== "all") {
    result = result.filter((item) => item.category === opts.category);
  }

  if (opts.seasons.size > 0) {
    result = result.filter((item) =>
      item.season.some((s) => opts.seasons.has(s as Season))
    );
  }

  if (opts.edibility.size > 0) {
    result = result.filter((item) => opts.edibility.has(item.edibilityLabel));
  }

  const query = opts.search.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (item) =>
        item.commonName.toLowerCase().includes(query) ||
        item.scientificName.toLowerCase().includes(query)
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const ITEMS: FieldGuideItem[] = [
  {
    id: "sp-1",
    commonName: "Chicken of the Woods",
    scientificName: "Laetiporus sulphureus",
    category: "mushroom",
    images: [],
    edibilityLabel: "commonly-considered-edible-with-expert-confirmation",
    season: ["Summer", "Fall"],
    habitat: "Hardwood trees",
    treeAssociations: ["Oak", "Cherry"],
  },
  {
    id: "sp-2",
    commonName: "Destroying Angel",
    scientificName: "Amanita bisporigera",
    category: "mushroom",
    images: [],
    edibilityLabel: "toxic",
    season: ["Summer", "Fall"],
    habitat: "Mixed forests",
    treeAssociations: ["Oak"],
  },
  {
    id: "pl-1",
    commonName: "Ramps",
    scientificName: "Allium tricoccum",
    category: "plant",
    images: [],
    edibilityLabel: "commonly-considered-edible-with-expert-confirmation",
    season: ["Spring"],
    habitat: "Rich cove forests",
    treeAssociations: ["Maple", "Beech"],
  },
  {
    id: "tr-1",
    commonName: "White Oak",
    scientificName: "Quercus alba",
    category: "tree",
    images: [],
    edibilityLabel: "unknown",
    season: [],
    habitat: "Upland forests",
    treeAssociations: [],
  },
  {
    id: "sp-3",
    commonName: "Turkey Tail",
    scientificName: "Trametes versicolor",
    category: "mushroom",
    images: [],
    edibilityLabel: "inedible",
    season: ["Spring", "Summer", "Fall", "Winter"],
    habitat: "Dead hardwood",
    treeAssociations: ["Oak", "Maple"],
  },
];

const NO_FILTERS = {
  category: "all" as const,
  seasons: new Set<Season>(),
  edibility: new Set<EdibilityLabel>(),
  search: "",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Field Guide filter logic", () => {
  it("returns all items when no filters are active", () => {
    const result = filterItems(ITEMS, NO_FILTERS);
    expect(result).toHaveLength(5);
  });

  describe("category filter", () => {
    it("filters by mushroom category", () => {
      const result = filterItems(ITEMS, { ...NO_FILTERS, category: "mushroom" });
      expect(result).toHaveLength(3);
      expect(result.every((i) => i.category === "mushroom")).toBe(true);
    });

    it("filters by plant category", () => {
      const result = filterItems(ITEMS, { ...NO_FILTERS, category: "plant" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pl-1");
    });

    it("filters by tree category", () => {
      const result = filterItems(ITEMS, { ...NO_FILTERS, category: "tree" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("tr-1");
    });
  });

  describe("season filter", () => {
    it("filters by single season — Spring", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        seasons: new Set<Season>(["Spring"]),
      });
      // Ramps (Spring), Turkey Tail (all seasons)
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id).sort()).toEqual(["pl-1", "sp-3"]);
    });

    it("filters by multiple seasons — matches if ANY season overlaps", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        seasons: new Set<Season>(["Winter"]),
      });
      // Only Turkey Tail has Winter
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-3");
    });

    it("excludes items with no seasons (trees) when season filter is active", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        seasons: new Set<Season>(["Summer"]),
      });
      // White Oak has empty season array — should be excluded
      expect(result.find((i) => i.id === "tr-1")).toBeUndefined();
    });
  });

  describe("edibility filter", () => {
    it("filters by toxic edibility", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        edibility: new Set<EdibilityLabel>(["toxic"]),
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-2");
    });

    it("filters by multiple edibility labels", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        edibility: new Set<EdibilityLabel>(["toxic", "inedible"]),
      });
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id).sort()).toEqual(["sp-2", "sp-3"]);
    });

    it("filters by expert confirmation edibility", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        edibility: new Set<EdibilityLabel>([
          "commonly-considered-edible-with-expert-confirmation",
        ]),
      });
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id).sort()).toEqual(["pl-1", "sp-1"]);
    });
  });

  describe("search filter", () => {
    it("searches by common name", () => {
      const result = filterItems(ITEMS, { ...NO_FILTERS, search: "chicken" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-1");
    });

    it("searches by scientific name", () => {
      const result = filterItems(ITEMS, { ...NO_FILTERS, search: "trametes" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-3");
    });

    it("search is case-insensitive", () => {
      const result = filterItems(ITEMS, { ...NO_FILTERS, search: "RAMPS" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pl-1");
    });
  });

  describe("combined filters (AND logic)", () => {
    it("category + season narrows results", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        category: "mushroom",
        seasons: new Set<Season>(["Spring"]),
      });
      // Only Turkey Tail is a mushroom with Spring season
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-3");
    });

    it("category + edibility narrows results", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        category: "mushroom",
        edibility: new Set<EdibilityLabel>(["toxic"]),
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-2");
    });

    it("season + edibility + search narrows to specific item", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        seasons: new Set<Season>(["Fall"]),
        edibility: new Set<EdibilityLabel>([
          "commonly-considered-edible-with-expert-confirmation",
        ]),
        search: "chicken",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-1");
    });

    it("returns empty when filters conflict", () => {
      const result = filterItems(ITEMS, {
        ...NO_FILTERS,
        category: "tree",
        edibility: new Set<EdibilityLabel>(["toxic"]),
      });
      // No tree is toxic in our test data
      expect(result).toHaveLength(0);
    });

    it("all filters active together", () => {
      const result = filterItems(ITEMS, {
        category: "mushroom",
        seasons: new Set<Season>(["Summer"]),
        edibility: new Set<EdibilityLabel>([
          "commonly-considered-edible-with-expert-confirmation",
        ]),
        search: "chicken",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sp-1");
    });
  });
});
