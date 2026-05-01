/**
 * Species Detail DOM Order — Unit Tests
 *
 * Verifies that the SpeciesOrPlantDetail component renders toxic lookalike
 * information BEFORE edibility notes in DOM order. This is a critical safety
 * requirement: users must see toxic lookalikes before any edibility discussion.
 *
 * Since @testing-library/react is not installed and the test environment is
 * node, we verify the ordering by analyzing the component's JSX structure
 * in the source file — checking that section IDs and component references
 * follow the correct order.
 *
 * **Validates: Requirements 1.7**
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const COMPONENT_PATH = path.resolve(
  __dirname,
  "../../src/app/field-guide/[id]/page.tsx"
);

describe("Species detail page — toxic lookalikes before edibility DOM order", () => {
  const source = fs.readFileSync(COMPONENT_PATH, "utf-8");

  it("source file exists and contains the SpeciesOrPlantDetail component", () => {
    expect(source).toBeTruthy();
    expect(source).toContain("SpeciesOrPlantDetail");
  });

  it('contains the CRITICAL ORDERING comment', () => {
    expect(source).toContain(
      "CRITICAL ORDERING: Toxic lookalikes BEFORE edibility/safety"
    );
  });

  it('toxic lookalikes section (id="section-toxic-lookalikes") appears before EdibilityTab in JSX', () => {
    // Find the position of the toxic lookalikes section
    const toxicSectionIndex = source.indexOf('id="section-toxic-lookalikes"');
    // Find the position of the EdibilityTab component usage
    const edibilityTabIndex = source.indexOf("<EdibilityTab");

    // Both must exist
    expect(toxicSectionIndex).toBeGreaterThan(-1);
    expect(edibilityTabIndex).toBeGreaterThan(-1);

    // Toxic lookalikes must appear before EdibilityTab in the source
    expect(toxicSectionIndex).toBeLessThan(edibilityTabIndex);
  });

  it('non-toxic lookalikes section (id="section-lookalikes") appears before EdibilityTab in JSX', () => {
    const lookalikeSectionIndex = source.indexOf('id="section-lookalikes"');
    const edibilityTabIndex = source.indexOf("<EdibilityTab");

    // Both must exist
    expect(lookalikeSectionIndex).toBeGreaterThan(-1);
    expect(edibilityTabIndex).toBeGreaterThan(-1);

    // Non-toxic lookalikes also appear before EdibilityTab
    expect(lookalikeSectionIndex).toBeLessThan(edibilityTabIndex);
  });

  it("toxic lookalikes section appears before non-toxic lookalikes section in JSX", () => {
    const toxicSectionIndex = source.indexOf('id="section-toxic-lookalikes"');
    const lookalikeSectionIndex = source.indexOf('id="section-lookalikes"');

    expect(toxicSectionIndex).toBeGreaterThan(-1);
    expect(lookalikeSectionIndex).toBeGreaterThan(-1);

    // Toxic lookalikes must come first
    expect(toxicSectionIndex).toBeLessThan(lookalikeSectionIndex);
  });

  it("ordering within SpeciesOrPlantDetail follows: toxic lookalikes → other lookalikes → EdibilityTab", () => {
    // Extract only the SpeciesOrPlantDetail function body to avoid
    // matching positions from imports or other components
    const componentStart = source.indexOf("function SpeciesOrPlantDetail");
    expect(componentStart).toBeGreaterThan(-1);

    // Find the next top-level function after SpeciesOrPlantDetail
    const componentEnd = source.indexOf("\nfunction TreeDetail", componentStart);
    expect(componentEnd).toBeGreaterThan(componentStart);

    const componentSource = source.slice(componentStart, componentEnd);

    const toxicPos = componentSource.indexOf('id="section-toxic-lookalikes"');
    const lookalikesPos = componentSource.indexOf('id="section-lookalikes"');
    const edibilityPos = componentSource.indexOf("<EdibilityTab");

    // All three must exist within the component
    expect(toxicPos).toBeGreaterThan(-1);
    expect(lookalikesPos).toBeGreaterThan(-1);
    expect(edibilityPos).toBeGreaterThan(-1);

    // Verify strict ordering: toxic < lookalikes < edibility
    expect(toxicPos).toBeLessThan(lookalikesPos);
    expect(lookalikesPos).toBeLessThan(edibilityPos);
  });
});
