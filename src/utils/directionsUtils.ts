import type { Coordinates } from '@/types';

/**
 * Build a Google Maps directions URL from GPS coordinates.
 *
 * Uses the Google Maps Directions URL scheme with the park or trailhead
 * coordinates as the destination.
 *
 * @param coordinates - GPS coordinate pair (lat, lng)
 * @returns Google Maps directions URL string
 */
export function buildDirectionsUrl(coordinates: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
}
