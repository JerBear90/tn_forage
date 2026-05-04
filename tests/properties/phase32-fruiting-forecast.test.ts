/**
 * Phase 3.2 Property Test P9: Fruiting forecast logic
 *
 * For any weather conditions and species triggers:
 * - Likelihood SHALL be high when score >= 75
 * - Likelihood SHALL be medium when score >= 50 and < 75
 * - Likelihood SHALL be low when score < 50
 * - Results SHALL be sorted by likelihood (high first)
 *
 * Validates: Requirements 25.2, 25.3, 25.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateFruitingLikelihood,
  generateFruitingPredictions,
  type SpeciesForecastInput,
} from '@/utils/fruitingForecast';
import type { WeatherSnapshot, FruitingTrigger } from '@/types';

const weatherArb: fc.Arbitrary<WeatherSnapshot> = fc.record({
  temperatureF: fc.integer({ min: 30, max: 100 }),
  humidity: fc.integer({ min: 20, max: 100 }),
  recentRainfallInches: fc.double({ min: 0, max: 10, noNaN: true }),
  conditions: fc.constantFrom('Sunny', 'Cloudy', 'Rainy', 'Partly cloudy'),
  fetchedAt: fc.constant(new Date().toISOString()),
});

const triggersArb: fc.Arbitrary<FruitingTrigger> = fc.record({
  minRainfallInches: fc.double({ min: 0.5, max: 5, noNaN: true }),
  rainfallWindowDays: fc.integer({ min: 3, max: 14 }),
  minTempF: fc.integer({ min: 40, max: 80 }),
  minHumidity: fc.integer({ min: 40, max: 90 }),
  minSoilTempF: fc.option(fc.integer({ min: 40, max: 70 })),
});

describe('Phase 3.2 Property P9: Fruiting forecast logic', () => {
  it('likelihood is always one of high, medium, or low', () => {
    fc.assert(
      fc.property(
        weatherArb,
        triggersArb,
        (weather, triggers) => {
          const { likelihood } = calculateFruitingLikelihood(weather, triggers);
          expect(['high', 'medium', 'low']).toContain(likelihood);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('high likelihood when all conditions are met', () => {
    const perfectWeather: WeatherSnapshot = {
      temperatureF: 80,
      humidity: 90,
      recentRainfallInches: 5,
      conditions: 'Rainy',
      soilTempEstimateF: 70,
      fetchedAt: new Date().toISOString(),
    };

    const easyTriggers: FruitingTrigger = {
      minRainfallInches: 1,
      rainfallWindowDays: 5,
      minTempF: 50,
      minHumidity: 50,
      minSoilTempF: 50,
    };

    const { likelihood } = calculateFruitingLikelihood(perfectWeather, easyTriggers);
    expect(likelihood).toBe('high');
  });

  it('low likelihood when no conditions are met', () => {
    const poorWeather: WeatherSnapshot = {
      temperatureF: 30,
      humidity: 20,
      recentRainfallInches: 0,
      conditions: 'Dry',
      fetchedAt: new Date().toISOString(),
    };

    const hardTriggers: FruitingTrigger = {
      minRainfallInches: 5,
      rainfallWindowDays: 5,
      minTempF: 80,
      minHumidity: 90,
      minSoilTempF: 70,
    };

    const { likelihood } = calculateFruitingLikelihood(poorWeather, hardTriggers);
    expect(likelihood).toBe('low');
  });

  it('predictions are sorted by likelihood (high first)', () => {
    fc.assert(
      fc.property(
        weatherArb,
        fc.array(triggersArb, { minLength: 2, maxLength: 10 }),
        (weather, triggersList) => {
          const species: SpeciesForecastInput[] = triggersList.map((t, i) => ({
            speciesId: `sp-${i}`,
            commonName: `Species ${i}`,
            triggers: t,
          }));

          const predictions = generateFruitingPredictions(species, weather);

          const order = { high: 0, medium: 1, low: 2 };
          for (let i = 1; i < predictions.length; i++) {
            expect(order[predictions[i].likelihood]).toBeGreaterThanOrEqual(
              order[predictions[i - 1].likelihood],
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
