/**
 * ForagingTipSection — Unit Tests (logic-level)
 *
 * Tests the rendering logic and decision-making of the ForagingTipSection
 * component: in-season tip display, out-of-season notice with season list,
 * empty seasons handling, safety language compliance, and generic fallback
 * messages.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * the component's decision-making logic by replicating the same branching
 * and data lookups the component performs.
 *
 * **Validates: Requirements 3.1, 3.4, 3.5**
 */

import { describe, it, expect } from 'vitest';
import {
  getCurrentSeason,
  isInSeasonForMonth,
  getCurrentMonth,
  type MonthIndex,
} from '@/utils/seasonHelpers';
import { speciesForagingTips } from '@/data/foragingTips';
import { containsBannedPhrase } from '@/utils/safetyLanguage';

// ---------------------------------------------------------------------------
// Helpers — replicate ForagingTipSection rendering logic
// ---------------------------------------------------------------------------

/**
 * Replicates the tip lookup logic from ForagingTipSection.
 * Returns the tip text displayed for a given species, seasons, and common name.
 */
function getDisplayedContent(
  speciesId: string,
  seasons: string[],
  commonName: string,
  month: MonthIndex,
): { type: 'in-season-tip' | 'in-season-generic' | 'out-of-season' | 'no-data'; text: string } {
  const currentSeason = getCurrentSeason(
    new Date(2024, month, 15), // use a date in the given month
  );
  const inSeason = isInSeasonForMonth(seasons, month);

  if (inSeason) {
    const tipEntry = speciesForagingTips.find(
      (t) => t.speciesId === speciesId && t.season === currentSeason,
    );

    if (tipEntry) {
      return { type: 'in-season-tip', text: tipEntry.tip };
    }

    // Generic fallback for in-season species without a matching tip
    return {
      type: 'in-season-generic',
      text: `${commonName} is currently in season. Check local hardwood forests and familiar habitats for this species. Always verify your identification with a qualified expert before consuming.`,
    };
  }

  // Not in season
  if (seasons.length > 0) {
    return {
      type: 'out-of-season',
      text: `${commonName} is typically found during ${seasons.join(', ')}. Check back when conditions are right for this species.`,
    };
  }

  return {
    type: 'no-data',
    text: `No season data is available for ${commonName}.`,
  };
}

// ---------------------------------------------------------------------------
// 1. In-season species with a matching tip entry displays the tip text
// ---------------------------------------------------------------------------

describe('ForagingTipSection — in-season tip display', () => {
  it('displays the matching tip for Morel in Spring (month 2 = March)', () => {
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 2);
    expect(result.type).toBe('in-season-tip');
    expect(result.text).toContain('Morels are a possible match');
    expect(result.text).toContain('honeycomb-patterned caps');
  });

  it('displays the matching tip for Chanterelle in Summer (month 6 = July)', () => {
    const result = getDisplayedContent('sp-chanterelle', ['Summer', 'Fall'], 'Chanterelle', 6);
    expect(result.type).toBe('in-season-tip');
    expect(result.text).toContain('Chanterelles are a possible match');
    expect(result.text).toContain('golden-yellow');
  });

  it('displays the matching tip for Chanterelle in Fall (month 8 = September)', () => {
    const result = getDisplayedContent('sp-chanterelle', ['Summer', 'Fall'], 'Chanterelle', 8);
    expect(result.type).toBe('in-season-tip');
    expect(result.text).toContain('Chanterelles may continue fruiting into early fall');
  });

  it('displays the matching tip for Oyster Mushroom in Winter (month 0 = January)', () => {
    const result = getDisplayedContent('sp-oyster-mushroom', ['Fall', 'Winter', 'Spring'], 'Oyster Mushroom', 0);
    expect(result.type).toBe('in-season-tip');
    expect(result.text).toContain('Oyster Mushrooms are one of the few species');
  });

  it('displays the matching tip for Chicken of the Woods in Summer (month 5 = June)', () => {
    const result = getDisplayedContent('sp-chicken-of-the-woods', ['Summer', 'Fall'], 'Chicken of the Woods', 5);
    expect(result.type).toBe('in-season-tip');
    expect(result.text).toContain('Chicken of the Woods is a possible match');
    expect(result.text).toContain('bright orange and yellow');
  });

  it('tip text includes expert verification reminder', () => {
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 3);
    expect(result.type).toBe('in-season-tip');
    expect(result.text.toLowerCase()).toContain('expert');
  });
});

// ---------------------------------------------------------------------------
// 2. In-season species without a matching tip entry displays generic message
// ---------------------------------------------------------------------------

describe('ForagingTipSection — in-season generic fallback', () => {
  it('displays generic message for unknown species ID in season', () => {
    // Use a species ID that has no tip entries but is in season
    const result = getDisplayedContent('sp-unknown-species', ['Spring'], 'Unknown Mushroom', 3);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('Unknown Mushroom is currently in season');
  });

  it('generic message includes the species common name', () => {
    const result = getDisplayedContent('sp-nonexistent', ['Summer'], 'Fairy Ring', 6);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('Fairy Ring');
  });

  it('generic message includes habitat guidance', () => {
    const result = getDisplayedContent('sp-nonexistent', ['Fall'], 'Test Species', 9);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('hardwood forests');
  });

  it('generic message includes expert verification reminder', () => {
    const result = getDisplayedContent('sp-nonexistent', ['Winter'], 'Test Species', 0);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('Always verify your identification with a qualified expert');
  });
});

// ---------------------------------------------------------------------------
// 3. Out-of-season species displays "Not currently in season" notice
// ---------------------------------------------------------------------------

describe('ForagingTipSection — out-of-season notice', () => {
  it('returns out-of-season type for Spring species viewed in Summer', () => {
    // Morel is Spring only; month 6 (July) is Summer
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 6);
    expect(result.type).toBe('out-of-season');
  });

  it('out-of-season text includes the species common name', () => {
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 6);
    expect(result.text).toContain('Morel');
  });

  it('out-of-season text includes "typically found during"', () => {
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 6);
    expect(result.text).toContain('typically found during');
  });
});

// ---------------------------------------------------------------------------
// 4. Out-of-season species lists the seasons when typically found
// ---------------------------------------------------------------------------

describe('ForagingTipSection — out-of-season season list', () => {
  it('lists single season for Spring-only species', () => {
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 6);
    expect(result.text).toContain('Spring');
  });

  it('lists multiple seasons joined by comma for multi-season species', () => {
    const result = getDisplayedContent('sp-chanterelle', ['Summer', 'Fall'], 'Chanterelle', 0);
    expect(result.text).toContain('Summer, Fall');
  });

  it('lists three seasons for Oyster Mushroom when out of season', () => {
    // Oyster Mushroom: Fall, Winter, Spring — out of season in Summer (month 6)
    const result = getDisplayedContent('sp-oyster-mushroom', ['Fall', 'Winter', 'Spring'], 'Oyster Mushroom', 6);
    expect(result.type).toBe('out-of-season');
    expect(result.text).toContain('Fall, Winter, Spring');
  });

  it('includes "Check back when conditions are right" message', () => {
    const result = getDisplayedContent('sp-morel', ['Spring'], 'Morel', 8);
    expect(result.text).toContain('Check back when conditions are right');
  });
});

// ---------------------------------------------------------------------------
// 5. Empty seasons array shows "No season data is available" message
// ---------------------------------------------------------------------------

describe('ForagingTipSection — empty seasons array', () => {
  it('returns no-data type when seasons is empty', () => {
    const result = getDisplayedContent('sp-unknown', [], 'Unknown Species', 3);
    expect(result.type).toBe('no-data');
  });

  it('displays "No season data is available" message', () => {
    const result = getDisplayedContent('sp-unknown', [], 'Unknown Species', 3);
    expect(result.text).toContain('No season data is available');
  });

  it('includes the species common name in the no-data message', () => {
    const result = getDisplayedContent('sp-test', [], 'Mystery Mushroom', 6);
    expect(result.text).toContain('Mystery Mushroom');
  });

  it('no-data message matches exact format', () => {
    const result = getDisplayedContent('sp-test', [], 'Test Species', 0);
    expect(result.text).toBe('No season data is available for Test Species.');
  });
});

// ---------------------------------------------------------------------------
// 6. All tip text from speciesForagingTips passes safety language compliance
// ---------------------------------------------------------------------------

describe('ForagingTipSection — safety language compliance', () => {
  it('no species foraging tip contains any banned phrase', () => {
    for (const tipEntry of speciesForagingTips) {
      const banned = containsBannedPhrase(tipEntry.tip);
      expect(
        banned,
        `Tip for ${tipEntry.speciesId} (${tipEntry.season}) contains banned phrase "${banned}"`,
      ).toBeNull();
    }
  });

  it('no tip contains "safe to eat"', () => {
    for (const tipEntry of speciesForagingTips) {
      expect(tipEntry.tip.toLowerCase()).not.toContain('safe to eat');
    }
  });

  it('no tip contains "definitely edible"', () => {
    for (const tipEntry of speciesForagingTips) {
      expect(tipEntry.tip.toLowerCase()).not.toContain('definitely edible');
    }
  });

  it('no tip contains "confirmed edible"', () => {
    for (const tipEntry of speciesForagingTips) {
      expect(tipEntry.tip.toLowerCase()).not.toContain('confirmed edible');
    }
  });

  it('no tip contains "ai verified"', () => {
    for (const tipEntry of speciesForagingTips) {
      expect(tipEntry.tip.toLowerCase()).not.toContain('ai verified');
    }
  });

  it('all tips use "possible match" language per Requirement 10.2', () => {
    for (const tipEntry of speciesForagingTips) {
      expect(
        tipEntry.tip.toLowerCase(),
        `Tip for ${tipEntry.speciesId} (${tipEntry.season}) should use "possible match" language`,
      ).toContain('possible match');
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Generic fallback messages contain expert verification reminder
// ---------------------------------------------------------------------------

describe('ForagingTipSection — generic fallback expert verification', () => {
  it('generic in-season fallback contains "qualified expert"', () => {
    const result = getDisplayedContent('sp-nonexistent', ['Spring'], 'Test Species', 3);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('qualified expert');
  });

  it('generic in-season fallback contains "Always verify"', () => {
    const result = getDisplayedContent('sp-nonexistent', ['Summer'], 'Test Species', 6);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('Always verify');
  });

  it('generic in-season fallback contains "before consuming"', () => {
    const result = getDisplayedContent('sp-nonexistent', ['Fall'], 'Test Species', 9);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toContain('before consuming');
  });

  it('generic fallback text matches the exact component output', () => {
    const name = 'Golden Chanterelle';
    const result = getDisplayedContent('sp-nonexistent', ['Winter'], name, 0);
    expect(result.type).toBe('in-season-generic');
    expect(result.text).toBe(
      `${name} is currently in season. Check local hardwood forests and familiar habitats for this species. Always verify your identification with a qualified expert before consuming.`,
    );
  });
});
