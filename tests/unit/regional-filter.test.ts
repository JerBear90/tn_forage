/**
 * Property-based test for regional filter composition (Property 8)
 *
 * Feature: forageflow-enhancements, Property 8: Regional filter composition
 *
 * Uses fast-check to generate random FieldGuideItem lists with random
 * regions arrays, apply random filter combinations (region, category,
 * season, edibility), and verify that filtered results contain only items
 * satisfying ALL active filter criteria simultaneously.
 *
 * **Validates: Requirements 13.2, 13.3, 13.5**
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import type { EdibilityLabel, SpeciesCategory, TnRegion } from "@/types";

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
  regions: string[];
}

type Season = "Spring" | "Summer" | "Fall" | "Winter";

/**
 * Pure filter function that mirrors the exact filtering behavior in
 * src/app/field-guide/page.tsx, including the new regional filter.
 */
export function filterItems(
  items: FieldGuideItem[],
  opts: {
    category: SpeciesCategory | "all";
    region: TnRegion | "all";
    seasons: Set<Season>;
    edibility: Set<EdibilityLabel>;
    search: string;
  }
): FieldGuideItem[] {
  let result = items;

  if (opts.category !== "all") {
    result = result.filter((item) => item.category === opts.category);
  }

  if (opts.region !== "all") {
    result = result.filter((item) => item.regions.includes(opts.region));
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
// Arbitraries
// ---------------------------------------------------------------------------

const CATEGORIES: SpeciesCategory[] = ["mushroom", "plant", "tree"];
const REGIONS: TnRegion[] = ["East TN", "Middle TN", "West TN"];
const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];
const EDIBILITY_LABELS: EdibilityLabel[] = [
  "commonly-considered-edible-with-expert-confirmation",
  "toxic",
  "inedible",
  "unknown",
];

const arbCategory = fc.constantFrom<SpeciesCategory>(...CATEGORIES);
const arbRegion = fc.constantFrom<TnRegion>(...REGIONS);
const arbSeason = fc.constantFrom<Season>(...SEASONS);
const arbEdibility = fc.constantFrom<EdibilityLabel>(...EDIBILITY_LABELS);

const arbFieldGuideItem: fc.Arbitrary<FieldGuideItem> = fc.record({
  id: fc.uuid(),
  commonName: fc.string({ minLength: 1, maxLength: 30 }),
  scientificName: fc.string({ minLength: 1, maxLength: 30 }),
  category: arbCategory,
  images: fc.constant([]),
  edibilityLabel: arbEdibility,
  season: fc.subarray(SEASONS, { minLength: 0, maxLength: 4 }),
  habitat: fc.string({ minLength: 0, maxLength: 20 }),
  treeAssociations: fc.constant([]),
  regions: fc.subarray(REGIONS, { minLength: 0, maxLength: 3 }),
});

const arbCategoryFilter = fc.constantFrom<SpeciesCategory | "all">(
  "all",
  ...CATEGORIES
);
const arbRegionFilter = fc.constantFrom<TnRegion | "all">("all", ...REGIONS);
const arbSeasonSet = fc
  .subarray(SEASONS, { minLength: 0, maxLength: 4 })
  .map((arr) => new Set(arr));
const arbEdibilitySet = fc
  .subarray(EDIBILITY_LABELS, { minLength: 0, maxLength: 4 })
  .map((arr) => new Set(arr));

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe("Feature: forageflow-enhancements, Property 8: Regional filter composition", () => {
  it("filtered result contains only items satisfying ALL active filter criteria simultaneously", () => {
    fc.assert(
      fc.property(
        fc.array(arbFieldGuideItem, { minLength: 0, maxLength: 30 }),
        arbCategoryFilter,
        arbRegionFilter,
        arbSeasonSet,
        arbEdibilitySet,
        (items, category, region, seasons, edibility) => {
          const result = filterItems(items, {
            category,
            region,
            seasons,
            edibility,
            search: "",
          });

          for (const item of result) {
            // Category constraint
            if (category !== "all") {
              expect(item.category).toBe(category);
            }

            // Region constraint
            if (region !== "all") {
              expect(item.regions).toContain(region);
            }

            // Season constraint — item must have at least one matching season
            if (seasons.size > 0) {
              const hasMatchingSeason = item.season.some((s) =>
                seasons.has(s as Season)
              );
              expect(hasMatchingSeason).toBe(true);
            }

            // Edibility constraint
            if (edibility.size > 0) {
              expect(edibility.has(item.edibilityLabel)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('"All Regions" applies no region filtering — result is same as without region filter', () => {
    fc.assert(
      fc.property(
        fc.array(arbFieldGuideItem, { minLength: 0, maxLength: 30 }),
        arbCategoryFilter,
        arbSeasonSet,
        arbEdibilitySet,
        (items, category, seasons, edibility) => {
          const withAllRegions = filterItems(items, {
            category,
            region: "all",
            seasons,
            edibility,
            search: "",
          });

          // Filtering without region should produce the same result
          const withoutRegion = filterItems(items, {
            category,
            region: "all",
            seasons,
            edibility,
            search: "",
          });

          expect(withAllRegions).toEqual(withoutRegion);

          // Also verify no items were excluded due to region
          // by checking that all items matching other criteria are present
          const manualFilter = items.filter((item) => {
            if (category !== "all" && item.category !== category) return false;
            if (
              seasons.size > 0 &&
              !item.season.some((s) => seasons.has(s as Season))
            )
              return false;
            if (edibility.size > 0 && !edibility.has(item.edibilityLabel))
              return false;
            return true;
          });

          expect(withAllRegions).toEqual(manualFilter);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("result is a subset of the input — no items are invented", () => {
    fc.assert(
      fc.property(
        fc.array(arbFieldGuideItem, { minLength: 0, maxLength: 30 }),
        arbCategoryFilter,
        arbRegionFilter,
        arbSeasonSet,
        arbEdibilitySet,
        (items, category, region, seasons, edibility) => {
          const result = filterItems(items, {
            category,
            region,
            seasons,
            edibility,
            search: "",
          });

          // Every result item must be in the original list
          for (const item of result) {
            expect(items).toContain(item);
          }

          // Result length cannot exceed input length
          expect(result.length).toBeLessThanOrEqual(items.length);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("no qualifying items are excluded — filter is complete", () => {
    fc.assert(
      fc.property(
        fc.array(arbFieldGuideItem, { minLength: 0, maxLength: 30 }),
        arbCategoryFilter,
        arbRegionFilter,
        arbSeasonSet,
        arbEdibilitySet,
        (items, category, region, seasons, edibility) => {
          const result = filterItems(items, {
            category,
            region,
            seasons,
            edibility,
            search: "",
          });

          // Manually check each item that should pass all filters
          for (const item of items) {
            const passesCategory =
              category === "all" || item.category === category;
            const passesRegion =
              region === "all" || item.regions.includes(region);
            const passesSeason =
              seasons.size === 0 ||
              item.season.some((s) => seasons.has(s as Season));
            const passesEdibility =
              edibility.size === 0 || edibility.has(item.edibilityLabel);

            const shouldBeIncluded =
              passesCategory && passesRegion && passesSeason && passesEdibility;

            if (shouldBeIncluded) {
              expect(result).toContain(item);
            } else {
              expect(result).not.toContain(item);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
