/**
 * ForageFlow — Verification Checklist Logic
 *
 * Pure logic module for the lookalike verification checklist.
 * Determines when the checklist should be shown and defines
 * the checklist items.
 *
 * Separated from the React component so it can be tested
 * independently without JSX parsing.
 */

import type { EdibilityLabel } from "@/types";

// ---------------------------------------------------------------------------
// Checklist items
// ---------------------------------------------------------------------------

export const CHECKLIST_ITEMS = [
  {
    id: "reviewed-lookalikes",
    label: "I have reviewed the toxic lookalikes for this species",
  },
  {
    id: "understand-possible-match",
    label: "I understand this is a possible match, not a confirmation",
  },
  {
    id: "verify-with-expert",
    label: "I will verify with a qualified expert before consuming",
  },
] as const;

export type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]["id"];

// ---------------------------------------------------------------------------
// Gate logic
// ---------------------------------------------------------------------------

/**
 * Determines whether a species result requires the lookalike verification
 * checklist before the user can navigate to the species detail page.
 *
 * Gate condition:
 *   - edibilityLabel is "commonly-considered-edible-with-expert-confirmation"
 *   - AND hasToxicLookalikes is true
 *
 * If the species is toxic, inedible, or unknown, or has no toxic lookalikes,
 * the user can proceed directly to the detail page.
 */
export function requiresVerificationChecklist(result: {
  edibilityLabel: EdibilityLabel;
  hasToxicLookalikes: boolean;
}): boolean {
  return (
    result.edibilityLabel ===
      "commonly-considered-edible-with-expert-confirmation" &&
    result.hasToxicLookalikes
  );
}
