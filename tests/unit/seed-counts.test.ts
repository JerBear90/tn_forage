/**
 * Seed Data Counts — Unit Tests
 *
 * Verifies that the species and plant seed data arrays meet the
 * minimum count requirements defined in Phase 3 enhancements.
 *
 * **Validates: Requirements 1.1, 2.1**
 */

import { describe, it, expect } from 'vitest';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';

describe('Seed data counts', () => {
  it('speciesSeed contains at least 30 mushroom species', () => {
    expect(speciesSeed.length).toBeGreaterThanOrEqual(30);
  });

  it('plantsSeed contains at least 15 plant species', () => {
    expect(plantsSeed.length).toBeGreaterThanOrEqual(15);
  });
});
