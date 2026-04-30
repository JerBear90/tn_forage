/**
 * Unit tests for the Lookalike Verification Checklist logic.
 *
 * Tests the gate logic that determines when the verification checklist
 * should appear, and the checklist item requirements.
 */

import { describe, it, expect } from "vitest";
import {
  requiresVerificationChecklist,
  CHECKLIST_ITEMS,
} from "@/services/verificationChecklist";

// ---------------------------------------------------------------------------
// Gate logic tests
// ---------------------------------------------------------------------------

describe("requiresVerificationChecklist", () => {
  it("returns true for edible species with toxic lookalikes", () => {
    expect(
      requiresVerificationChecklist({
        edibilityLabel: "commonly-considered-edible-with-expert-confirmation",
        hasToxicLookalikes: true,
      })
    ).toBe(true);
  });

  it("returns false for edible species without toxic lookalikes", () => {
    expect(
      requiresVerificationChecklist({
        edibilityLabel: "commonly-considered-edible-with-expert-confirmation",
        hasToxicLookalikes: false,
      })
    ).toBe(false);
  });

  it("returns false for toxic species with toxic lookalikes", () => {
    expect(
      requiresVerificationChecklist({
        edibilityLabel: "toxic",
        hasToxicLookalikes: true,
      })
    ).toBe(false);
  });

  it("returns false for toxic species without toxic lookalikes", () => {
    expect(
      requiresVerificationChecklist({
        edibilityLabel: "toxic",
        hasToxicLookalikes: false,
      })
    ).toBe(false);
  });

  it("returns false for inedible species with toxic lookalikes", () => {
    expect(
      requiresVerificationChecklist({
        edibilityLabel: "inedible",
        hasToxicLookalikes: true,
      })
    ).toBe(false);
  });

  it("returns false for unknown edibility with toxic lookalikes", () => {
    expect(
      requiresVerificationChecklist({
        edibilityLabel: "unknown",
        hasToxicLookalikes: true,
      })
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Checklist items tests
// ---------------------------------------------------------------------------

describe("CHECKLIST_ITEMS", () => {
  it("contains exactly 3 items", () => {
    expect(CHECKLIST_ITEMS).toHaveLength(3);
  });

  it("includes the toxic lookalike review item", () => {
    const labels = CHECKLIST_ITEMS.map((item) => item.label);
    expect(labels).toContain(
      "I have reviewed the toxic lookalikes for this species"
    );
  });

  it("includes the possible match acknowledgment item", () => {
    const labels = CHECKLIST_ITEMS.map((item) => item.label);
    expect(labels).toContain(
      "I understand this is a possible match, not a confirmation"
    );
  });

  it("includes the expert verification item", () => {
    const labels = CHECKLIST_ITEMS.map((item) => item.label);
    expect(labels).toContain(
      "I will verify with a qualified expert before consuming"
    );
  });

  it("each item has a unique id", () => {
    const ids = CHECKLIST_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
