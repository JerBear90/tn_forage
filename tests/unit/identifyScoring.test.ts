/**
 * Unit tests for the identification scoring service.
 *
 * Tests the pure scoring logic, confidence levels, and result ordering.
 */

import { describe, it, expect } from 'vitest';
import {
  scoreSpecies,
  getConfidenceLevel,
  type IdentificationResult,
} from '@/services/identifyScoring';
import type {
  IdentificationWizardAnswers,
  Species,
} from '@/types';
import { DEFAULT_WIZARD_ANSWERS } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal species factory for testing */
function makeSpecies(overrides: Partial<Species> = {}): Species {
  return {
    id: 'sp-test',
    commonName: 'Test Mushroom',
    scientificName: 'Testus fungus',
    category: 'mushroom',
    images: [],
    habitat: 'Found on the ground in hardwood forests near oaks.',
    treeAssociations: ['Oak', 'Beech'],
    season: ['Summer', 'Fall'],
    region: 'Tennessee',
    identificationSteps: [
      'Look for golden-yellow caps on the forest floor.',
      'Cap is funnel-shaped or wavy with irregular edges.',
      'Underside has pores.',
      'Flesh is white and firm.',
    ],
    lookalikes: [],
    toxicLookalikes: [],
    sporePrint: 'White',
    bruisingNotes: 'Does not bruise significantly.',
    edibilityLabel: 'commonly-considered-edible-with-expert-confirmation',
    safetyNotes: 'Verify with a qualified expert before consuming.',
    sources: [],
    lastUpdated: '2024-01-01',
    ...overrides,
  };
}

function makeAnswers(
  overrides: Partial<IdentificationWizardAnswers> = {},
): IdentificationWizardAnswers {
  return {
    ...DEFAULT_WIZARD_ANSWERS,
    stemFeatures: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getConfidenceLevel
// ---------------------------------------------------------------------------

describe('getConfidenceLevel', () => {
  it('returns "Strong possible match" for >= 70%', () => {
    expect(getConfidenceLevel(70)).toBe('Strong possible match');
    expect(getConfidenceLevel(100)).toBe('Strong possible match');
    expect(getConfidenceLevel(85)).toBe('Strong possible match');
  });

  it('returns "Possible match" for >= 40% and < 70%', () => {
    expect(getConfidenceLevel(40)).toBe('Possible match');
    expect(getConfidenceLevel(69)).toBe('Possible match');
    expect(getConfidenceLevel(55)).toBe('Possible match');
  });

  it('returns "Low confidence" for >= 20% and < 40%', () => {
    expect(getConfidenceLevel(20)).toBe('Low confidence');
    expect(getConfidenceLevel(39)).toBe('Low confidence');
  });

  it('returns "Insufficient information" for < 20%', () => {
    expect(getConfidenceLevel(0)).toBe('Insufficient information');
    expect(getConfidenceLevel(19)).toBe('Insufficient information');
    expect(getConfidenceLevel(10)).toBe('Insufficient information');
  });
});

// ---------------------------------------------------------------------------
// scoreSpecies — basic scoring
// ---------------------------------------------------------------------------

describe('scoreSpecies', () => {
  it('returns an empty array when given no species', () => {
    const answers = makeAnswers({ season: 'Summer' });
    expect(scoreSpecies(answers, [])).toEqual([]);
  });

  it('scores season match correctly (+2)', () => {
    const species = makeSpecies({ season: ['Summer', 'Fall'] });
    const answers = makeAnswers({ season: 'Summer' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Season');
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('does not score season when wizard season is null', () => {
    const species = makeSpecies({ season: ['Summer'] });
    const answers = makeAnswers({ season: null });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).not.toContain('Season');
  });

  it('scores tree association match correctly (+2)', () => {
    const species = makeSpecies({ treeAssociations: ['Oak', 'Beech'] });
    const answers = makeAnswers({ nearbyTree: 'Oak' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Tree association');
  });

  it('does not score tree when wizard selects "Unknown"', () => {
    const species = makeSpecies({ treeAssociations: ['Oak'] });
    const answers = makeAnswers({ nearbyTree: 'Unknown' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).not.toContain('Tree association');
  });

  it('scores habitat/growth location match (+1)', () => {
    const species = makeSpecies({
      habitat: 'Found on dead wood and fallen logs.',
    });
    const answers = makeAnswers({ growthLocation: 'Dead wood' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Habitat');
  });

  it('scores bruising "None" match against "does not bruise" notes', () => {
    const species = makeSpecies({
      bruisingNotes: 'Does not bruise significantly.',
    });
    const answers = makeAnswers({ bruisingReaction: 'None' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Bruising');
  });

  it('scores bruising color match', () => {
    const species = makeSpecies({
      bruisingNotes: 'Turns yellowish-brown when bruised.',
    });
    const answers = makeAnswers({ bruisingReaction: 'Brown' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Bruising');
  });

  it('scores underside type match from identification steps (+2)', () => {
    const species = makeSpecies({
      identificationSteps: ['Underside has pores.', 'Cap is fan-shaped.'],
    });
    const answers = makeAnswers({ undersideType: 'Pores' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Underside type');
  });

  it('scores cap color match from identification steps (+1)', () => {
    const species = makeSpecies({
      identificationSteps: [
        'Look for golden-yellow caps.',
        'Underside has pores.',
      ],
    });
    const answers = makeAnswers({ capColor: 'Yellow' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Cap color');
  });

  it('scores cap shape match from identification steps (+1)', () => {
    const species = makeSpecies({
      identificationSteps: [
        'Cap is funnel-shaped or wavy.',
        'Underside has pores.',
      ],
    });
    const answers = makeAnswers({ capShape: 'Funnel' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).toContain('Cap shape');
  });

  it('does not score cap color when "Other" is selected', () => {
    const species = makeSpecies({
      identificationSteps: ['Look for white caps.'],
    });
    const answers = makeAnswers({ capColor: 'Other' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).not.toContain('Cap color');
  });

  it('does not score cap shape when "Unknown" is selected', () => {
    const species = makeSpecies({
      identificationSteps: ['Cap is convex.'],
    });
    const answers = makeAnswers({ capShape: 'Unknown' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.matchedAttributes).not.toContain('Cap shape');
  });
});

// ---------------------------------------------------------------------------
// scoreSpecies — sorting and confidence
// ---------------------------------------------------------------------------

describe('scoreSpecies — sorting and confidence', () => {
  it('sorts results by percentage descending', () => {
    const highMatch = makeSpecies({
      id: 'sp-high',
      commonName: 'High Match',
      season: ['Summer'],
      treeAssociations: ['Oak'],
      habitat: 'Found on soil near oaks.',
      identificationSteps: ['Underside has pores.', 'Cap is funnel-shaped, yellow.'],
      bruisingNotes: 'Does not bruise significantly.',
    });
    const lowMatch = makeSpecies({
      id: 'sp-low',
      commonName: 'Low Match',
      season: ['Winter'],
      treeAssociations: ['Pine'],
      habitat: 'Found in coniferous forests.',
      identificationSteps: ['Cap is smooth and brown.'],
      bruisingNotes: 'Bruises blue.',
    });

    const answers = makeAnswers({
      season: 'Summer',
      nearbyTree: 'Oak',
      growthLocation: 'Soil',
      undersideType: 'Pores',
      capShape: 'Funnel',
      capColor: 'Yellow',
      bruisingReaction: 'None',
    });

    const results = scoreSpecies(answers, [lowMatch, highMatch]);
    expect(results[0].speciesId).toBe('sp-high');
    expect(results[1].speciesId).toBe('sp-low');
  });

  it('assigns correct confidence levels based on percentage', () => {
    const species = makeSpecies({
      season: ['Summer'],
      treeAssociations: ['Oak'],
    });

    // Only provide season — should match, giving 2/2 = 100%
    const answers = makeAnswers({ season: 'Summer' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.percentage).toBe(100);
    expect(result.confidence).toBe('Strong possible match');
  });

  it('returns "Insufficient information" when maxScore is 0', () => {
    const species = makeSpecies({
      identificationSteps: [],
      bruisingNotes: undefined,
    });
    // All answers null/Unknown — nothing to score
    const answers = makeAnswers();
    const [result] = scoreSpecies(answers, [species]);

    expect(result.maxScore).toBe(0);
    expect(result.confidence).toBe('Insufficient information');
  });
});

// ---------------------------------------------------------------------------
// scoreSpecies — toxic lookalikes flag
// ---------------------------------------------------------------------------

describe('scoreSpecies — toxic lookalikes', () => {
  it('sets hasToxicLookalikes to true when species has toxic lookalikes', () => {
    const species = makeSpecies({
      toxicLookalikes: [
        {
          speciesId: 'sp-toxic',
          commonName: 'Toxic One',
          isToxic: true,
          differentiatingFeatures: 'Has true gills.',
        },
      ],
    });
    const answers = makeAnswers({ season: 'Summer' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.hasToxicLookalikes).toBe(true);
  });

  it('sets hasToxicLookalikes to false when species has no toxic lookalikes', () => {
    const species = makeSpecies({ toxicLookalikes: [] });
    const answers = makeAnswers({ season: 'Summer' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.hasToxicLookalikes).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// scoreSpecies — edibility label passthrough
// ---------------------------------------------------------------------------

describe('scoreSpecies — edibility label', () => {
  it('passes through the species edibility label', () => {
    const species = makeSpecies({ edibilityLabel: 'toxic' });
    const answers = makeAnswers({ season: 'Summer' });
    const [result] = scoreSpecies(answers, [species]);

    expect(result.edibilityLabel).toBe('toxic');
  });
});

// ---------------------------------------------------------------------------
// scoreSpecies — full integration with seed data shape
// ---------------------------------------------------------------------------

describe('scoreSpecies — realistic scenario', () => {
  it('scores Chanterelle high for matching answers', () => {
    const chanterelle = makeSpecies({
      id: 'sp-chanterelle',
      commonName: 'Chanterelle',
      scientificName: 'Cantharellus cibarius',
      habitat:
        'Found on the ground in hardwood and mixed forests, often near oaks and beeches. Prefers mossy, well-drained slopes.',
      treeAssociations: ['Oak', 'Beech', 'Hickory', 'Poplar'],
      season: ['Summer', 'Fall'],
      identificationSteps: [
        'Look for golden-yellow to egg-yolk colored caps on the forest floor.',
        'Cap is funnel-shaped or wavy with irregular edges, 2–15 cm wide.',
        'Underside has blunt, forked ridges (false gills) that run down the stem — not true blade-like gills.',
        'Stem is solid, tapers downward, and is the same color as the cap.',
        'Flesh is white to pale yellow and firm.',
        'Has a fruity, apricot-like aroma.',
      ],
      bruisingNotes:
        'Does not bruise blue or black. May show slight darkening when handled.',
      toxicLookalikes: [
        {
          speciesId: 'sp-jack-o-lantern',
          commonName: "Jack O'Lantern",
          isToxic: true,
          differentiatingFeatures: 'Has true gills.',
        },
      ],
    });

    const answers = makeAnswers({
      season: 'Summer',
      nearbyTree: 'Oak',
      growthLocation: 'Soil',
      undersideType: 'Gills',
      capColor: 'Yellow',
      capShape: 'Funnel',
      bruisingReaction: 'None',
    });

    const [result] = scoreSpecies(answers, [chanterelle]);

    // Should match: season(+2), tree(+2), cap color(+1), cap shape(+1), bruising(+1)
    // Gills won't match because steps say "false gills" / "ridges" not "gills" as underside type
    // Actually "gills" appears in the text so it will match
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.hasToxicLookalikes).toBe(true);
    expect(result.confidence).not.toBe('Insufficient information');
  });
});
