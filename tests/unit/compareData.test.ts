/**
 * Unit tests for comparison data loading from IndexedDB.
 *
 * Tests that findRecordById correctly retrieves species, plants, and trees
 * for the comparison page, and that the data can be normalized for comparison.
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
import { findRecordById } from "@/hooks/useSpeciesDetail";
import type { Species, Plant, Tree, EdibilityLabel } from "@/types";

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

describe("findRecordById for comparison", () => {
  it("finds a species record by ID", async () => {
    await putRecord("species", makeSpecies({ id: "sp-compare-1" }));
    const result = await findRecordById("sp-compare-1");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("species");
    expect(result!.data.commonName).toBe("Test Mushroom");
  });

  it("finds a plant record by ID", async () => {
    await putRecord("plants", makePlant({ id: "pl-compare-1" }));
    const result = await findRecordById("pl-compare-1");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("plant");
    expect(result!.data.commonName).toBe("Test Plant");
  });

  it("finds a tree record by ID", async () => {
    await putRecord("trees", makeTree({ id: "tr-compare-1" }));
    const result = await findRecordById("tr-compare-1");
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("tree");
    expect(result!.data.commonName).toBe("Test Oak");
  });

  it("returns null for non-existent ID", async () => {
    const result = await findRecordById("nonexistent");
    expect(result).toBeNull();
  });
});

describe("comparison data normalization", () => {
  it("species records have all fields needed for comparison", async () => {
    const sp = makeSpecies({
      id: "sp-norm",
      commonName: "Chanterelle",
      scientificName: "Cantharellus cibarius",
      habitat: "Hardwood forests",
      treeAssociations: ["Oak", "Beech"],
      season: ["Summer", "Fall"],
      edibilityLabel: "commonly-considered-edible-with-expert-confirmation",
      safetyNotes: "Verify with a qualified expert before consuming.",
      identificationSteps: ["Step 1", "Step 2"],
    });
    await putRecord("species", sp);
    const result = await findRecordById("sp-norm");

    expect(result).not.toBeNull();
    const data = result!.data as Species;
    expect(data.commonName).toBe("Chanterelle");
    expect(data.scientificName).toBe("Cantharellus cibarius");
    expect(data.habitat).toBe("Hardwood forests");
    expect(data.treeAssociations).toEqual(["Oak", "Beech"]);
    expect(data.season).toEqual(["Summer", "Fall"]);
    expect(data.edibilityLabel).toBe("commonly-considered-edible-with-expert-confirmation");
    expect(data.safetyNotes).toBe("Verify with a qualified expert before consuming.");
    expect(data.identificationSteps).toEqual(["Step 1", "Step 2"]);
  });

  it("toxic species are identifiable by edibility label", async () => {
    await putRecord(
      "species",
      makeSpecies({ id: "sp-toxic", edibilityLabel: "toxic" })
    );
    const result = await findRecordById("sp-toxic");
    expect(result).not.toBeNull();
    expect((result!.data as Species).edibilityLabel).toBe("toxic");
  });

  it("can load multiple records for comparison", async () => {
    await putRecord("species", makeSpecies({ id: "sp-a", commonName: "Species A" }));
    await putRecord("species", makeSpecies({ id: "sp-b", commonName: "Species B" }));
    await putRecord("plants", makePlant({ id: "pl-a", commonName: "Plant A" }));

    const ids = ["sp-a", "sp-b", "pl-a"];
    const results = await Promise.all(ids.map((id) => findRecordById(id)));

    expect(results.filter(Boolean)).toHaveLength(3);
    expect(results[0]!.kind).toBe("species");
    expect(results[1]!.kind).toBe("species");
    expect(results[2]!.kind).toBe("plant");
  });

  it("handles mixed types in comparison (species + plant + tree)", async () => {
    await putRecord("species", makeSpecies({ id: "sp-mix" }));
    await putRecord("plants", makePlant({ id: "pl-mix" }));
    await putRecord("trees", makeTree({ id: "tr-mix" }));

    const ids = ["sp-mix", "pl-mix", "tr-mix"];
    const results = await Promise.all(ids.map((id) => findRecordById(id)));

    const kinds = results.filter(Boolean).map((r) => r!.kind);
    expect(kinds).toEqual(["species", "plant", "tree"]);
  });
});

describe("safety in comparison data", () => {
  it("no comparison data contains forbidden safety language", async () => {
    const forbidden = ["safe to eat", "confirmed edible", "definitely edible"];

    await putRecord(
      "species",
      makeSpecies({
        id: "sp-safe-check",
        safetyNotes: "Verify with a qualified expert before consuming.",
      })
    );

    const result = await findRecordById("sp-safe-check");
    expect(result).not.toBeNull();
    const text = (result!.data as Species).safetyNotes.toLowerCase();

    for (const phrase of forbidden) {
      expect(text).not.toContain(phrase);
    }
  });
});
