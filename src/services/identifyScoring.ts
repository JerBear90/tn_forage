/**
 * ForageFlow — Identification Scoring Service
 *
 * Pure function module (no React hooks) that scores species against
 * wizard answers from the Guided ID Wizard.
 *
 * SAFETY: Results are "possible matches" only. This module never uses
 * language like "confirmed", "safe to eat", or "definitely edible".
 */

import type {
  IdentificationWizardAnswers,
  EdibilityLabel,
  Species,
} from '@/types';

// ---------------------------------------------------------------------------
// Result Types
// ---------------------------------------------------------------------------

/** Confidence level for a scored species match */
export type ConfidenceLevel =
  | 'Strong possible match'
  | 'Possible match'
  | 'Low confidence'
  | 'Insufficient information';

/** A single scored identification result */
export interface IdentificationResult {
  speciesId: string;
  commonName: string;
  scientificName: string;
  images: string[];
  score: number;
  maxScore: number;
  percentage: number;
  confidence: ConfidenceLevel;
  matchedAttributes: string[];
  edibilityLabel: EdibilityLabel;
  hasToxicLookalikes: boolean;
}

// ---------------------------------------------------------------------------
// Confidence Thresholds
// ---------------------------------------------------------------------------

/**
 * Map a percentage score to a confidence level.
 *
 * - >= 70%: "Strong possible match"
 * - >= 40%: "Possible match"
 * - >= 20%: "Low confidence"
 * - < 20%:  "Insufficient information"
 */
export function getConfidenceLevel(percentage: number): ConfidenceLevel {
  if (percentage >= 70) return 'Strong possible match';
  if (percentage >= 40) return 'Possible match';
  if (percentage >= 20) return 'Low confidence';
  return 'Insufficient information';
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Case-insensitive check whether `text` contains `term`.
 */
function textContains(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

/**
 * Check if any of the identification steps mention a given term
 * (case-insensitive).
 */
function stepsContain(steps: string[], term: string): boolean {
  return steps.some((step) => textContains(step, term));
}

// ---------------------------------------------------------------------------
// Scoring Logic
// ---------------------------------------------------------------------------

/**
 * Score a single species against the wizard answers.
 *
 * Each matching attribute adds points. The maximum possible score varies
 * per species because not all species have all fields populated.
 *
 * Returns `{ score, maxScore, matchedAttributes }`.
 */
function scoreOneSpecies(
  answers: IdentificationWizardAnswers,
  species: Species,
): { score: number; maxScore: number; matchedAttributes: string[] } {
  let score = 0;
  let maxScore = 0;
  const matchedAttributes: string[] = [];

  // --- Season match (+2) ---
  // Only score if the user selected a season (not null)
  if (answers.season) {
    maxScore += 2;
    if (
      species.season &&
      species.season.length > 0 &&
      species.season.some(
        (s) => s.toLowerCase() === answers.season!.toLowerCase(),
      )
    ) {
      score += 2;
      matchedAttributes.push('Season');
    }
  }

  // --- Tree association match (+2) ---
  // Only score if the user selected a tree (not null and not "Unknown")
  if (answers.nearbyTree && answers.nearbyTree !== 'Unknown') {
    maxScore += 2;
    if (
      species.treeAssociations &&
      species.treeAssociations.length > 0 &&
      species.treeAssociations.some(
        (t) => t.toLowerCase() === answers.nearbyTree!.toLowerCase(),
      )
    ) {
      score += 2;
      matchedAttributes.push('Tree association');
    }
  }

  // --- Habitat / growth location relevance (+1) ---
  // Fuzzy match: check if the wizard's growth location appears in species habitat text
  if (answers.growthLocation && answers.growthLocation !== 'Unknown') {
    maxScore += 1;
    if (species.habitat && textContains(species.habitat, answers.growthLocation)) {
      score += 1;
      matchedAttributes.push('Habitat');
    }
  }

  // --- Bruising match (+1) ---
  // Check if the wizard's bruising reaction matches species bruisingNotes
  if (answers.bruisingReaction && answers.bruisingReaction !== 'Unknown') {
    if (species.bruisingNotes) {
      maxScore += 1;
      if (answers.bruisingReaction === 'None') {
        // "None" matches notes like "does not bruise"
        if (
          textContains(species.bruisingNotes, 'does not bruise') ||
          textContains(species.bruisingNotes, 'not bruise') ||
          textContains(species.bruisingNotes, 'no bruising') ||
          textContains(species.bruisingNotes, 'none')
        ) {
          score += 1;
          matchedAttributes.push('Bruising');
        }
      } else {
        if (textContains(species.bruisingNotes, answers.bruisingReaction)) {
          score += 1;
          matchedAttributes.push('Bruising');
        }
      }
    }
  }

  // --- Underside type match (+2) ---
  // Check if species identificationSteps mention the selected underside type
  if (answers.undersideType && answers.undersideType !== 'Unknown') {
    if (species.identificationSteps && species.identificationSteps.length > 0) {
      maxScore += 2;
      if (stepsContain(species.identificationSteps, answers.undersideType)) {
        score += 2;
        matchedAttributes.push('Underside type');
      }
    }
  }

  // --- Cap color match (+1) ---
  // Check if species identificationSteps mention the selected color
  if (answers.capColor && answers.capColor !== 'Other') {
    if (species.identificationSteps && species.identificationSteps.length > 0) {
      maxScore += 1;
      if (stepsContain(species.identificationSteps, answers.capColor)) {
        score += 1;
        matchedAttributes.push('Cap color');
      }
    }
  }

  // --- Cap shape match (+1) ---
  // Check if species identificationSteps mention the selected shape
  if (answers.capShape && answers.capShape !== 'Unknown') {
    if (species.identificationSteps && species.identificationSteps.length > 0) {
      maxScore += 1;
      if (stepsContain(species.identificationSteps, answers.capShape)) {
        score += 1;
        matchedAttributes.push('Cap shape');
      }
    }
  }

  return { score, maxScore, matchedAttributes };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score all species against the wizard answers and return results
 * sorted by score (highest first).
 *
 * @param answers - The completed wizard answers
 * @param speciesList - Array of species records to score against
 * @returns Sorted array of identification results
 */
export function scoreSpecies(
  answers: IdentificationWizardAnswers,
  speciesList: Species[],
): IdentificationResult[] {
  const results: IdentificationResult[] = speciesList.map((species) => {
    const { score, maxScore, matchedAttributes } = scoreOneSpecies(
      answers,
      species,
    );

    // Calculate percentage — if maxScore is 0, treat as insufficient data
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const confidence = maxScore === 0 ? 'Insufficient information' : getConfidenceLevel(percentage);

    return {
      speciesId: species.id,
      commonName: species.commonName,
      scientificName: species.scientificName,
      images: species.images ?? [],
      score,
      maxScore,
      percentage,
      confidence,
      matchedAttributes,
      edibilityLabel: species.edibilityLabel,
      hasToxicLookalikes:
        species.toxicLookalikes != null && species.toxicLookalikes.length > 0,
    };
  });

  // Sort by score descending, then by percentage descending for ties
  results.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return b.score - a.score;
  });

  return results;
}
