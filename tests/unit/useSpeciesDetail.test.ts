/**
 * Unit tests for src/hooks/useSpeciesDetail.ts
 *
 * Tests the findRecordById lookup logic across species, plants, and trees stores.
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

import { getDB, putRecord } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import { findRecordById } from "@/hooks/useSpeciesDetail";
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

describe("findRecordById", () => {
  it("finds a species record by ID", async () => {
    await putRecord("species", makeSpecies({ id: "sp-morel" }));

    const result = await findRecordById("sp-morel");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("species");
    expect(result!.data.id).toBe("sp-morel");
    expect(result!.data.commonName).toBe("Test Mushroom");
  });

  it("finds a plant record by ID", async () => {
    await putRecord("plants", makePlant({ id: "pl-ramps" }));

    const result = await findRecordById("pl-ramps");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("plant");
    expect(result!.data.id).toBe("pl-ramps");
  });

  it("finds a tree record by ID", async () => {
    await putRecord("trees", makeTree({ id: "tr-white-oak" }));

    const result = await findRecordById("tr-white-oak");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("tree");
    expect(result!.data.id).toBe("tr-white-oak");
  });

  it("returns null for a non-existent ID", async () => {
    const result = await findRecordById("does-not-exist");

    expect(result).toBeNull();
  });

  it("prioritizes species store over plants and trees", async () => {
    // Put the same ID in all three stores (unlikely but tests priority)
    await putRecord("species", makeSpecies({ id: "shared-id" }));
    await putRecord("plants", makePlant({ id: "shared-id" }));
    await putRecord("trees", makeTree({ id: "shared-id" }));

    const result = await findRecordById("shared-id");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("species");
  });

  it("falls through to plants when not in species", async () => {
    await putRecord("plants", makePlant({ id: "pl-only" }));

    const result = await findRecordById("pl-only");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("plant");
  });

  it("falls through to trees when not in species or plants", async () => {
    await putRecord("trees", makeTree({ id: "tr-only" }));

    const result = await findRecordById("tr-only");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("tree");
  });
});

describe("findRecordById with seeded data", () => {
  it("finds a seeded species by known ID", async () => {
    await seedDatabase();

    const result = await findRecordById("sp-chanterelle");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("species");
    expect(result!.data.commonName).toBe("Chanterelle");
  });

  it("finds a seeded plant by known ID", async () => {
    await seedDatabase();

    const result = await findRecordById("pl-ramps");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("plant");
    expect(result!.data.commonName).toBe("Ramps");
  });

  it("finds a seeded tree by known ID", async () => {
    await seedDatabase();

    const result = await findRecordById("tr-white-oak");

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("tree");
    expect(result!.data.commonName).toBe("White Oak");
  });
});

describe("species detail data integrity", () => {
  it("species record includes all required fields for detail page", async () => {
    await seedDatabase();

    const result = await findRecordById("sp-chanterelle");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("species");

    const data = result!.data as Species;
    expect(data.commonName).toBeTruthy();
    expect(data.scientificName).toBeTruthy();
    expect(data.category).toBe("mushroom");
    expect(data.images.length).toBeGreaterThan(0);
    expect(data.habitat).toBeTruthy();
    expect(data.treeAssociations.length).toBeGreaterThan(0);
    expect(data.season.length).toBeGreaterThan(0);
    expect(data.region).toBeTruthy();
    expect(data.identificationSteps.length).toBeGreaterThan(0);
    expect(data.edibilityLabel).toBeTruthy();
    expect(data.safetyNotes).toBeTruthy();
    expect(data.sources.length).toBeGreaterThan(0);
    expect(data.lastUpdated).toBeTruthy();
  });

  it("plant record includes all required fields for detail page", async () => {
    await seedDatabase();

    const result = await findRecordById("pl-ramps");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("plant");

    const data = result!.data as Plant;
    expect(data.commonName).toBeTruthy();
    expect(data.scientificName).toBeTruthy();
    expect(data.category).toBe("plant");
    expect(data.images.length).toBeGreaterThan(0);
    expect(data.habitat).toBeTruthy();
    expect(data.identificationSteps.length).toBeGreaterThan(0);
    expect(data.edibilityLabel).toBeTruthy();
    expect(data.safetyNotes).toBeTruthy();
    expect(data.sources.length).toBeGreaterThan(0);
    expect(data.lastUpdated).toBeTruthy();
  });

  it("tree record includes all required fields for detail page", async () => {
    await seedDatabase();

    const result = await findRecordById("tr-white-oak");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("tree");

    const data = result!.data as Tree;
    expect(data.commonName).toBeTruthy();
    expect(data.scientificName).toBeTruthy();
    expect(data.images.length).toBeGreaterThan(0);
    expect(data.habitat).toBeTruthy();
    expect(data.barkDescription).toBeTruthy();
    expect(data.leafDescription).toBeTruthy();
    expect(data.shapeDescription).toBeTruthy();
    expect(data.associatedSpecies.length).toBeGreaterThan(0);
    expect(data.region).toBeTruthy();
    expect(data.lastUpdated).toBeTruthy();
  });

  it("seeded species with toxic lookalikes have them populated", async () => {
    await seedDatabase();

    const result = await findRecordById("sp-chanterelle");
    const data = result!.data as Species;

    expect(data.toxicLookalikes.length).toBeGreaterThan(0);
    expect(data.toxicLookalikes[0].isToxic).toBe(true);
    expect(data.toxicLookalikes[0].commonName).toBeTruthy();
    expect(data.toxicLookalikes[0].differentiatingFeatures).toBeTruthy();
  });

  it("no seeded species safety notes contain forbidden language", async () => {
    await seedDatabase();

    const forbidden = ["safe to eat", "confirmed edible", "definitely edible"];

    // Check species
    const speciesResult = await findRecordById("sp-chicken-of-the-woods");
    const speciesData = speciesResult!.data as Species;
    const speciesText = speciesData.safetyNotes.toLowerCase();
    for (const phrase of forbidden) {
      expect(speciesText).not.toContain(phrase);
    }

    // Check plants
    const plantResult = await findRecordById("pl-ramps");
    const plantData = plantResult!.data as Plant;
    const plantText = plantData.safetyNotes.toLowerCase();
    for (const phrase of forbidden) {
      expect(plantText).not.toContain(phrase);
    }
  });
});
