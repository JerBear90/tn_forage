/**
 * Phase 3.2 Property Test P2: Required disclaimers present in safety-sensitive content
 *
 * Validates: Requirements 3.4, 3.6, 25.4, 26.5, 29.7, 32.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { plantsSeed } from '@/data/plantsSeed';

describe('Phase 3.2 Property P2: Required disclaimers', () => {
  it('plants with medicinalUses have required disclaimer', () => {
    const plantsWithMedicinal = plantsSeed.filter((p) => p.medicinalUses);

    fc.assert(
      fc.property(
        fc.constantFrom(...(plantsWithMedicinal.length > 0 ? plantsWithMedicinal : [plantsSeed[0]])),
        (plant) => {
          if (plant.medicinalUses) {
            expect(plant.medicinalUses.disclaimer).toContain('educational purposes only');
            expect(plant.medicinalUses.disclaimer).toContain('Consult a qualified healthcare professional');
          }
        },
      ),
      { numRuns: Math.max(plantsWithMedicinal.length, 1) },
    );
  });

  it('plants with transplantGuide have required disclaimer', () => {
    const plantsWithTransplant = plantsSeed.filter((p) => p.transplantGuide);

    fc.assert(
      fc.property(
        fc.constantFrom(...(plantsWithTransplant.length > 0 ? plantsWithTransplant : [plantsSeed[0]])),
        (plant) => {
          if (plant.transplantGuide) {
            expect(plant.transplantGuide.disclaimer).toContain('Check local and state regulations');
          }
        },
      ),
      { numRuns: Math.max(plantsWithTransplant.length, 1) },
    );
  });
});
