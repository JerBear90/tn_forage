import type { Coordinates } from '@/types';

/**
 * Build a weather.gov forecast URL from GPS coordinates.
 *
 * @param coordinates - GPS coordinate pair (lat, lng)
 * @returns weather.gov forecast URL string
 */
export function buildWeatherUrl(coordinates: Coordinates): string {
  return `https://forecast.weather.gov/MapClick.php?lat=${coordinates.lat}&lon=${coordinates.lng}`;
}
