/**
 * ForageWise — Fruiting Forecast Calculator
 *
 * Calculates fruiting predictions for mushroom species based on
 * current weather conditions and species-specific fruiting triggers.
 * Implements likelihood scoring (high/medium/low).
 *
 * Requirements: 25.2, 25.3, 25.6
 */

import type { WeatherSnapshot, FruitingTrigger, FruitingPrediction, FruitingLikelihood } from '@/types';

/**
 * Input data for a single species prediction.
 */
export interface SpeciesForecastInput {
  speciesId: string;
  commonName: string;
  image?: string;
  triggers: FruitingTrigger;
}

/**
 * Calculates the fruiting likelihood for a single species given current weather.
 *
 * Scoring:
 * - Each trigger condition met adds points
 * - rainfall: 30 points
 * - temperature: 25 points
 * - humidity: 25 points
 * - soil temperature: 20 points
 *
 * Likelihood thresholds:
 * - high: >= 75 points
 * - medium: >= 50 points
 * - low: < 50 points
 */
export function calculateFruitingLikelihood(
  weather: WeatherSnapshot,
  triggers: FruitingTrigger,
): { likelihood: FruitingLikelihood; score: number; metTriggers: string[] } {
  let score = 0;
  const metTriggers: string[] = [];

  // Rainfall check
  if (weather.recentRainfallInches >= triggers.minRainfallInches) {
    score += 30;
    metTriggers.push(
      `${weather.recentRainfallInches.toFixed(1)}in rain in last ${triggers.rainfallWindowDays} days`,
    );
  }

  // Temperature check
  if (weather.temperatureF >= triggers.minTempF) {
    score += 25;
    metTriggers.push(`Avg temp ${weather.temperatureF}°F (min ${triggers.minTempF}°F)`);
  }

  // Humidity check
  if (weather.humidity >= triggers.minHumidity) {
    score += 25;
    metTriggers.push(`Humidity ${weather.humidity}% (min ${triggers.minHumidity}%)`);
  }

  // Soil temperature check (if available)
  if (triggers.minSoilTempF !== undefined) {
    const soilTemp = weather.soilTempEstimateF ?? weather.temperatureF - 3;
    if (soilTemp >= triggers.minSoilTempF) {
      score += 20;
      metTriggers.push(`Est. soil temp ${soilTemp}°F (min ${triggers.minSoilTempF}°F)`);
    }
  } else {
    // No soil temp requirement — award partial points
    score += 10;
  }

  // Determine likelihood
  let likelihood: FruitingLikelihood;
  if (score >= 75) {
    likelihood = 'high';
  } else if (score >= 50) {
    likelihood = 'medium';
  } else {
    likelihood = 'low';
  }

  return { likelihood, score, metTriggers };
}

/**
 * Generates fruiting predictions for multiple species given current weather.
 * Returns predictions sorted by likelihood (high first).
 */
export function generateFruitingPredictions(
  species: SpeciesForecastInput[],
  weather: WeatherSnapshot,
): FruitingPrediction[] {
  const predictions: FruitingPrediction[] = species.map((sp) => {
    const { likelihood, metTriggers } = calculateFruitingLikelihood(weather, sp.triggers);

    return {
      speciesId: sp.speciesId,
      commonName: sp.commonName,
      image: sp.image,
      likelihood,
      triggers: metTriggers,
      lastUpdated: new Date().toISOString(),
    };
  });

  // Sort: high > medium > low
  const order: Record<FruitingLikelihood, number> = { high: 0, medium: 1, low: 2 };
  predictions.sort((a, b) => order[a.likelihood] - order[b.likelihood]);

  return predictions;
}
