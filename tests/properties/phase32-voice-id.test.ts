/**
 * Phase 3.2 Property Test P15: Voice ID equivalence
 *
 * For any natural language description containing known keywords,
 * the parser SHALL extract the corresponding structured features.
 *
 * Validates: Requirements 29.3, 29.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseVoiceDescription, mergeWithDefaults } from '@/utils/voiceIdParser';

describe('Phase 3.2 Property P15: Voice ID equivalence', () => {
  it('extracts cap color from descriptions containing color keywords', () => {
    const colorMap: Record<string, string> = {
      brown: 'Brown',
      white: 'White',
      yellow: 'Yellow',
      orange: 'Orange',
      red: 'Red',
      gray: 'Gray',
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(colorMap)),
        (color) => {
          const result = parseVoiceDescription(`I found a ${color} mushroom`);
          expect(result.capColor).toBe(colorMap[color]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('extracts growth location from descriptions', () => {
    const locationMap: Record<string, string> = {
      'on the ground': 'Soil',
      'on a log': 'Dead wood',
      'on a stump': 'Dead wood',
      'in leaf litter': 'Leaf litter',
      'on moss': 'Moss',
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(locationMap)),
        (phrase) => {
          const result = parseVoiceDescription(`Found it growing ${phrase}`);
          expect(result.growthLocation).toBe(locationMap[phrase]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('extracts nearby tree from descriptions', () => {
    const treeMap: Record<string, string> = {
      oak: 'Oak',
      hickory: 'Hickory',
      maple: 'Maple',
      pine: 'Pine',
      poplar: 'Poplar',
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(treeMap)),
        (tree) => {
          const result = parseVoiceDescription(`Near an ${tree} tree`);
          expect(result.nearbyTree).toBe(treeMap[tree]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('mergeWithDefaults produces complete wizard answers', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        (transcript) => {
          const parsed = parseVoiceDescription(transcript);
          const merged = mergeWithDefaults(parsed);

          // All required fields should be present
          expect(merged).toHaveProperty('undersideType');
          expect(merged).toHaveProperty('growthLocation');
          expect(merged).toHaveProperty('capColor');
          expect(merged).toHaveProperty('stemFeatures');
          expect(Array.isArray(merged.stemFeatures)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
