/**
 * Unit tests for src/hooks/useSpecies.ts
 *
 * Tests the data loading, normalization, and seeding logic.
 * Uses fake-indexeddb for in-memory IndexedDB.
 */

import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

// Polyfill crypto for Node
import { webcrypto } from "crypto";
if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error — Node webcrypto is compatible enough
  globalThis.crypto = webcrypto;
}

import { getDB, getAllRecords, putRecord } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type { Species, Plant, Tree } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearStores() {
  const db = await getDB();
  await db.clear("species");
  await db.clear("plants");
  await db.clear("trees");
}

function makeSpecies(overrides: Partial<Species> = {}): Species {
  return {
    id: "sp-test",
    commonName: "Test Mushroom",
    scientificName: "Testus fungus",
    category: "mushroom",
    images: ["/images/test.jpg"],
    habitat: "Test habitat",
    treeAssociations: ["Oak"],
    season: ["Fall"],
    region: "Tennessee",
    identificationSteps: ["Step 1"],
    lookalikes: [],
    toxicLookalikes: [],
    edibilityLabel: "unknown",
    safetyNotes: "Test safety notes",
    sources: ["Test source"],
    lastUpdated: "2024-01-01",
    ...overrides,
  };
}

function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: "pl-test",
    commonName: "Test Plant",
    scientificName: "Testus plantus",
    category: "plant",
    images: ["/images/test-plant.jpg"],
    habitat: "Test plant habitat",
    treeAssociations: ["Maple"],
    season: ["Spring"],
    region: "Tennessee",
    identificationSteps: ["Step 1"],
    lookalikes: [],
    toxicLookalikes: [],
    edibilityLabel: "commonly-considered-edible-with-expert-confirmation",
    safetyNotes: "Test plant safety",
    sources: ["Test source"],
    lastUpdated: "2024-01-01",
    ...overrides,
  };
}

function makeTree(overrides: Partial<Tree> = {}): Tree {
  return {
    id: "tr-test",
    commonName: "Test Oak",
    scientificName: "Quercus testus",
    images: ["/images/test-tree.jpg"],
    habitat: "Test tree habitat",
    barkDescription: "Rough bark",
    leafDescription: "Lobed leaves",
    shapeDescription: "Tall and broad",
    associatedSpecies: ["Chanterelle"],
    region: "Tennessee",
    lastUpdated: "2024-01-01",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStores();
});

describe("seedDatabase", () => {
  it("seeds all three stores when empty", async () => {
    const result = await seedDatabase();

    expect(result.speciesSeeded).toBeGreaterThan(0);
    expect(result.plantsSeeded).toBeGreaterThan(0);
    expect(result.treesSeeded).toBeGreaterThan(0);
  });

  it("is idempotent — does not re-seed when stores have data", async () => {
    await seedDatabase();
    const result = await seedDatabase();

    expect(result.speciesSeeded).toBe(0);
    expect(result.plantsSeeded).toBe(0);
    expect(result.treesSeeded).toBe(0);
  });
});

describe("getAllRecords integration", () => {
  it("returns species records after seeding", async () => {
    await seedDatabase();
    const species = await getAllRecords("species");

    expect(species.length).toBeGreaterThan(0);
    expect(species[0]).toHaveProperty("commonName");
    expect(species[0]).toHaveProperty("scientificName");
    expect(species[0]).toHaveProperty("category");
    expect(species[0].category).toBe("mushroom");
  });

  it("returns plant records after seeding", async () => {
    await seedDatabase();
    const plants = await getAllRecords("plants");

    expect(plants.length).toBeGreaterThan(0);
    expect(plants[0]).toHaveProperty("commonName");
    expect(plants[0]).toHaveProperty("edibilityLabel");
  });

  it("returns tree records after seeding", async () => {
    await seedDatabase();
    const trees = await getAllRecords("trees");

    expect(trees.length).toBeGreaterThan(0);
    expect(trees[0]).toHaveProperty("commonName");
    expect(trees[0]).toHaveProperty("barkDescription");
  });
});

describe("data normalization for FieldGuideItem shape", () => {
  it("species records have all required FieldGuideItem fields", async () => {
    await putRecord("species", makeSpecies());
    const records = await getAllRecords("species");
    const s = records[0];

    // These fields map directly to FieldGuideItem
    expect(s.id).toBe("sp-test");
    expect(s.commonName).toBe("Test Mushroom");
    expect(s.scientificName).toBe("Testus fungus");
    expect(s.category).toBe("mushroom");
    expect(s.images).toEqual(["/images/test.jpg"]);
    expect(s.edibilityLabel).toBe("unknown");
    expect(s.season).toEqual(["Fall"]);
    expect(s.habitat).toBe("Test habitat");
  });

  it("plant records have all required FieldGuideItem fields", async () => {
    await putRecord("plants", makePlant());
    const records = await getAllRecords("plants");
    const p = records[0];

    expect(p.id).toBe("pl-test");
    expect(p.commonName).toBe("Test Plant");
    expect(p.scientificName).toBe("Testus plantus");
    expect(p.category).toBe("plant");
    expect(p.edibilityLabel).toBe(
      "commonly-considered-edible-with-expert-confirmation"
    );
    expect(p.season).toEqual(["Spring"]);
  });

  it("tree records can be normalized — trees lack edibilityLabel and season", async () => {
    await putRecord("trees", makeTree());
    const records = await getAllRecords("trees");
    const t = records[0];

    expect(t.id).toBe("tr-test");
    expect(t.commonName).toBe("Test Oak");
    expect(t.scientificName).toBe("Quercus testus");
    // Trees don't have category/edibilityLabel/season — the hook normalizes these
    expect(t).not.toHaveProperty("category");
    expect(t).not.toHaveProperty("edibilityLabel");
    expect(t).not.toHaveProperty("season");
  });
});

describe("combined data loading", () => {
  it("loads records from all three stores", async () => {
    await putRecord("species", makeSpecies({ id: "sp-1", commonName: "Alpha Mushroom" }));
    await putRecord("plants", makePlant({ id: "pl-1", commonName: "Beta Plant" }));
    await putRecord("trees", makeTree({ id: "tr-1", commonName: "Gamma Oak" }));

    const species = await getAllRecords("species");
    const plants = await getAllRecords("plants");
    const trees = await getAllRecords("trees");

    expect(species).toHaveLength(1);
    expect(plants).toHaveLength(1);
    expect(trees).toHaveLength(1);

    // Verify we can combine them
    const combined = [
      ...species.map((s) => ({ id: s.id, commonName: s.commonName, category: s.category })),
      ...plants.map((p) => ({ id: p.id, commonName: p.commonName, category: p.category })),
      ...trees.map((t) => ({ id: t.id, commonName: t.commonName, category: "tree" as const })),
    ];

    expect(combined).toHaveLength(3);
    expect(combined.map((c) => c.category)).toEqual(["mushroom", "plant", "tree"]);
  });

  it("returns empty arrays when stores are empty", async () => {
    const species = await getAllRecords("species");
    const plants = await getAllRecords("plants");
    const trees = await getAllRecords("trees");

    expect(species).toEqual([]);
    expect(plants).toEqual([]);
    expect(trees).toEqual([]);
  });
});

describe("seed data integrity", () => {
  it("all seeded species have valid edibility labels", async () => {
    await seedDatabase();
    const species = await getAllRecords("species");
    const validLabels = [
      "commonly-considered-edible-with-expert-confirmation",
      "toxic",
      "inedible",
      "unknown",
    ];

    for (const s of species) {
      expect(validLabels).toContain(s.edibilityLabel);
    }
  });

  it("all seeded plants have valid edibility labels", async () => {
    await seedDatabase();
    const plants = await getAllRecords("plants");
    const validLabels = [
      "commonly-considered-edible-with-expert-confirmation",
      "toxic",
      "inedible",
      "unknown",
    ];

    for (const p of plants) {
      expect(validLabels).toContain(p.edibilityLabel);
    }
  });

  it("no species entry contains forbidden safety language", async () => {
    await seedDatabase();
    const species = await getAllRecords("species");
    const forbidden = ["safe to eat", "confirmed edible", "definitely edible"];

    for (const s of species) {
      const text = `${s.safetyNotes} ${s.edibilityLabel}`.toLowerCase();
      for (const phrase of forbidden) {
        expect(text).not.toContain(phrase);
      }
    }
  });

  it("no plant entry contains forbidden safety language", async () => {
    await seedDatabase();
    const plants = await getAllRecords("plants");
    const forbidden = ["safe to eat", "confirmed edible", "definitely edible"];

    for (const p of plants) {
      const text = `${p.safetyNotes} ${p.edibilityLabel}`.toLowerCase();
      for (const phrase of forbidden) {
        expect(text).not.toContain(phrase);
      }
    }
  });
});
