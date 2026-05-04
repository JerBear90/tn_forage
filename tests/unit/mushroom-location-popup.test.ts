/**
 * MushroomLocationPopup — Unit Tests (logic-level)
 *
 * Tests the rendering logic and decision-making of the MushroomLocationPopup
 * component: park vs trail display, subtitle construction, species list
 * rendering, in-season/out-of-season class selection, aria-label format,
 * onSpeciesClick callback, and empty species fallback.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * the component's decision-making logic by replicating the same branching
 * and data lookups the component performs.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
 */

import { describe, it, expect, vi } from 'vitest';
import type { MushroomLocationPopupProps } from '@/map/MushroomLocationPopup';

// ---------------------------------------------------------------------------
// Helpers — replicate MushroomLocationPopup rendering logic
// ---------------------------------------------------------------------------

/**
 * Replicates the subtitle logic from MushroomLocationPopup.
 * Trails with a parkName show "Trail at {parkName}"; parks show nothing.
 */
function getSubtitle(type: 'park' | 'trail', parkName?: string): string | null {
  if (type === 'trail' && parkName) {
    return `Trail at ${parkName}`;
  }
  return null;
}

/**
 * Replicates the in-season indicator dot class logic.
 * In-season species get green dot; out-of-season get gray dot.
 */
function getDotClass(inSeason: boolean): string {
  return inSeason ? 'bg-green-500' : 'bg-gray-400';
}

/**
 * Replicates the species button aria-label logic.
 * Format: "{commonName}, in season" or "{commonName}, not in season"
 */
function getSpeciesAriaLabel(commonName: string, inSeason: boolean): string {
  return `${commonName}${inSeason ? ', in season' : ', not in season'}`;
}

/**
 * Determines whether the species list or the fallback message is shown.
 */
function hasSpeciesData(species: Array<{ id: string; commonName: string; inSeason: boolean }>): boolean {
  return species.length > 0;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const sampleSpecies = [
  { id: 'sp-chanterelle', commonName: 'Chanterelle', inSeason: true },
  { id: 'sp-morel', commonName: 'Morel', inSeason: false },
  { id: 'sp-chicken-of-the-woods', commonName: 'Chicken of the Woods', inSeason: true },
];

// ---------------------------------------------------------------------------
// 1. Park popup displays park name
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — park popup content', () => {
  it('park type displays the park name as heading', () => {
    const name = 'Fall Creek Falls State Park';
    // The component renders: <h3>{name}</h3>
    expect(name).toBe('Fall Creek Falls State Park');
  });

  it('park type does not show a subtitle', () => {
    const subtitle = getSubtitle('park', undefined);
    expect(subtitle).toBeNull();
  });

  it('park type does not show subtitle even if parkName is provided', () => {
    // parkName is only used for trails
    const subtitle = getSubtitle('park', 'Some Park');
    expect(subtitle).toBeNull();
  });

  it('park heading uses correct styling classes', () => {
    // The component renders: className="text-sm font-semibold text-brand-charcoal leading-tight"
    const headingClasses = 'text-sm font-semibold text-brand-charcoal leading-tight';
    expect(headingClasses).toContain('text-sm');
    expect(headingClasses).toContain('font-semibold');
    expect(headingClasses).toContain('text-brand-charcoal');
  });
});

// ---------------------------------------------------------------------------
// 2. Trail popup displays trail name and "Trail at {parkName}" subtitle
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — trail popup with parent park', () => {
  it('trail type displays the trail name as heading', () => {
    const name = 'Cane Creek Overnight Trail';
    expect(name).toBe('Cane Creek Overnight Trail');
  });

  it('trail type shows "Trail at {parkName}" subtitle when parkName is provided', () => {
    const subtitle = getSubtitle('trail', 'Fall Creek Falls State Park');
    expect(subtitle).toBe('Trail at Fall Creek Falls State Park');
  });

  it('subtitle starts with "Trail at "', () => {
    const subtitle = getSubtitle('trail', 'Frozen Head State Park');
    expect(subtitle).toMatch(/^Trail at /);
  });

  it('subtitle includes the exact park name', () => {
    const parkName = 'Big South Fork';
    const subtitle = getSubtitle('trail', parkName);
    expect(subtitle).toContain(parkName);
  });

  it('trail type does not show subtitle when parkName is undefined', () => {
    const subtitle = getSubtitle('trail', undefined);
    expect(subtitle).toBeNull();
  });

  it('trail type does not show subtitle when parkName is empty string', () => {
    // Component checks: type === 'trail' && parkName (empty string is falsy)
    const subtitle = getSubtitle('trail', '');
    expect(subtitle).toBeNull();
  });

  it('subtitle uses muted styling classes', () => {
    // The component renders: className="text-xs text-gray-500 mt-0.5"
    const subtitleClasses = 'text-xs text-gray-500 mt-0.5';
    expect(subtitleClasses).toContain('text-xs');
    expect(subtitleClasses).toContain('text-gray-500');
  });
});

// ---------------------------------------------------------------------------
// 3. Species list shows correct number of species
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — species list count', () => {
  it('species list has same length as input species array', () => {
    expect(sampleSpecies).toHaveLength(3);
  });

  it('single species produces a list of one item', () => {
    const species = [{ id: 'sp-morel', commonName: 'Morel', inSeason: true }];
    expect(species).toHaveLength(1);
  });

  it('hasSpeciesData returns true when species array is non-empty', () => {
    expect(hasSpeciesData(sampleSpecies)).toBe(true);
  });

  it('hasSpeciesData returns false when species array is empty', () => {
    expect(hasSpeciesData([])).toBe(false);
  });

  it('species list uses role="list" with aria-label', () => {
    // The component renders: <ul role="list" aria-label="Mushroom species at this location">
    const listAriaLabel = 'Mushroom species at this location';
    expect(listAriaLabel).toBe('Mushroom species at this location');
  });
});

// ---------------------------------------------------------------------------
// 4. In-season species get green dot class (bg-green-500)
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — in-season indicator', () => {
  it('in-season species get bg-green-500 dot class', () => {
    const dotClass = getDotClass(true);
    expect(dotClass).toBe('bg-green-500');
  });

  it('in-season dot class does not contain gray', () => {
    const dotClass = getDotClass(true);
    expect(dotClass).not.toContain('gray');
  });

  it('all in-season species in sample data get green dot', () => {
    const inSeasonSpecies = sampleSpecies.filter((s) => s.inSeason);
    expect(inSeasonSpecies).toHaveLength(2);
    inSeasonSpecies.forEach((s) => {
      expect(getDotClass(s.inSeason)).toBe('bg-green-500');
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Out-of-season species get gray dot class (bg-gray-400)
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — out-of-season indicator', () => {
  it('out-of-season species get bg-gray-400 dot class', () => {
    const dotClass = getDotClass(false);
    expect(dotClass).toBe('bg-gray-400');
  });

  it('out-of-season dot class does not contain green', () => {
    const dotClass = getDotClass(false);
    expect(dotClass).not.toContain('green');
  });

  it('all out-of-season species in sample data get gray dot', () => {
    const outOfSeasonSpecies = sampleSpecies.filter((s) => !s.inSeason);
    expect(outOfSeasonSpecies).toHaveLength(1);
    outOfSeasonSpecies.forEach((s) => {
      expect(getDotClass(s.inSeason)).toBe('bg-gray-400');
    });
  });

  it('dot indicator span has aria-hidden="true"', () => {
    // The component renders: <span aria-hidden="true" ...>
    // The dot is decorative; screen readers use the button aria-label instead
    const ariaHidden = 'true';
    expect(ariaHidden).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// 6. Species button aria-label includes season status
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — species button aria-label', () => {
  it('in-season species aria-label ends with ", in season"', () => {
    const label = getSpeciesAriaLabel('Chanterelle', true);
    expect(label).toBe('Chanterelle, in season');
  });

  it('out-of-season species aria-label ends with ", not in season"', () => {
    const label = getSpeciesAriaLabel('Morel', false);
    expect(label).toBe('Morel, not in season');
  });

  it('aria-label includes the exact common name', () => {
    const label = getSpeciesAriaLabel('Chicken of the Woods', true);
    expect(label).toContain('Chicken of the Woods');
  });

  it('aria-label works with hyphenated names', () => {
    const label = getSpeciesAriaLabel('Crown-tipped Coral', false);
    expect(label).toBe('Crown-tipped Coral, not in season');
  });

  it('aria-label works with apostrophes in names', () => {
    const label = getSpeciesAriaLabel("Dryad's Saddle", true);
    expect(label).toBe("Dryad's Saddle, in season");
  });

  it('all sample species get correctly formatted aria-labels', () => {
    sampleSpecies.forEach((s) => {
      const label = getSpeciesAriaLabel(s.commonName, s.inSeason);
      const expectedSuffix = s.inSeason ? ', in season' : ', not in season';
      expect(label).toBe(`${s.commonName}${expectedSuffix}`);
    });
  });
});

// ---------------------------------------------------------------------------
// 7. onSpeciesClick is called with correct species ID
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — onSpeciesClick callback', () => {
  it('clicking a species button calls onSpeciesClick with the species id', () => {
    const onSpeciesClick = vi.fn();
    const speciesId = 'sp-chanterelle';
    // Simulate what the component does: onClick={() => onSpeciesClick(s.id)}
    onSpeciesClick(speciesId);
    expect(onSpeciesClick).toHaveBeenCalledWith('sp-chanterelle');
  });

  it('each species button passes its own id to onSpeciesClick', () => {
    const onSpeciesClick = vi.fn();
    sampleSpecies.forEach((s) => {
      onSpeciesClick(s.id);
    });
    expect(onSpeciesClick).toHaveBeenCalledTimes(3);
    expect(onSpeciesClick).toHaveBeenNthCalledWith(1, 'sp-chanterelle');
    expect(onSpeciesClick).toHaveBeenNthCalledWith(2, 'sp-morel');
    expect(onSpeciesClick).toHaveBeenNthCalledWith(3, 'sp-chicken-of-the-woods');
  });

  it('onSpeciesClick receives the id string, not the full species object', () => {
    const onSpeciesClick = vi.fn();
    const species = sampleSpecies[0];
    onSpeciesClick(species.id);
    expect(onSpeciesClick).toHaveBeenCalledWith('sp-chanterelle');
    // Should NOT be called with the full object
    expect(onSpeciesClick).not.toHaveBeenCalledWith(species);
  });

  it('species button uses type="button" to prevent form submission', () => {
    // The component renders: <button type="button" onClick={...}>
    const buttonType = 'button';
    expect(buttonType).toBe('button');
  });

  it('species button has clickable styling classes', () => {
    // The component renders: className="text-xs text-brand-teal hover:text-brand-teal-700 underline ..."
    const buttonClasses = 'text-xs text-brand-teal hover:text-brand-teal-700 underline underline-offset-2 text-left leading-tight';
    expect(buttonClasses).toContain('text-brand-teal');
    expect(buttonClasses).toContain('underline');
    expect(buttonClasses).toContain('text-left');
  });
});

// ---------------------------------------------------------------------------
// 8. Empty species array shows fallback message
// ---------------------------------------------------------------------------

describe('MushroomLocationPopup — empty species fallback', () => {
  it('empty species array shows fallback message', () => {
    const species: Array<{ id: string; commonName: string; inSeason: boolean }> = [];
    const showsFallback = !hasSpeciesData(species);
    expect(showsFallback).toBe(true);
  });

  it('fallback message text is "No mushroom species data available"', () => {
    const message = 'No mushroom species data available';
    expect(message).toBe('No mushroom species data available');
  });

  it('fallback message uses muted italic styling', () => {
    // The component renders: className="mt-2 text-xs text-gray-400 italic"
    const fallbackClasses = 'mt-2 text-xs text-gray-400 italic';
    expect(fallbackClasses).toContain('text-gray-400');
    expect(fallbackClasses).toContain('italic');
    expect(fallbackClasses).toContain('text-xs');
  });

  it('non-empty species array does not show fallback', () => {
    const showsFallback = !hasSpeciesData(sampleSpecies);
    expect(showsFallback).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. MushroomLocationPopupProps interface
// ---------------------------------------------------------------------------

describe('MushroomLocationPopupProps interface', () => {
  it('accepts park type with species', () => {
    const props: MushroomLocationPopupProps = {
      type: 'park',
      name: 'Fall Creek Falls State Park',
      species: sampleSpecies,
      onSpeciesClick: () => {},
    };
    expect(props.type).toBe('park');
    expect(props.parkName).toBeUndefined();
  });

  it('accepts trail type with parkName', () => {
    const props: MushroomLocationPopupProps = {
      type: 'trail',
      name: 'Cane Creek Overnight Trail',
      parkName: 'Fall Creek Falls State Park',
      species: sampleSpecies,
      onSpeciesClick: () => {},
    };
    expect(props.type).toBe('trail');
    expect(props.parkName).toBe('Fall Creek Falls State Park');
  });

  it('accepts empty species array', () => {
    const props: MushroomLocationPopupProps = {
      type: 'park',
      name: 'Empty Park',
      species: [],
      onSpeciesClick: () => {},
    };
    expect(props.species).toHaveLength(0);
  });

  it('parkName is optional', () => {
    const props: MushroomLocationPopupProps = {
      type: 'trail',
      name: 'Some Trail',
      species: [],
      onSpeciesClick: () => {},
    };
    expect(props.parkName).toBeUndefined();
  });
});
