/**
 * ForageWise — Tennessee Routes Seed Data
 *
 * Local seed data for multi-trail routes within Tennessee State Parks.
 * Routes are longer, multi-segment paths that may span multiple trails.
 * This data is loaded into IndexedDB on first run.
 *
 * Each route includes realistic coordinates for polyline rendering,
 * distance, difficulty, likely trees, and likely species.
 */

import type { Route } from '@/types';

export const routesSeed: Route[] = [
  // --- Savage Gulf Full Loop ---
  {
    id: 'route-savage-gulf-day-loop',
    parkId: 'park-savage-gulf',
    name: 'Savage Gulf Day Loop',
    distance: 9.8,
    difficulty: 'hard',
    coordinates: [
      { lat: 35.4575, lng: -85.5900 },
      { lat: 35.4565, lng: -85.5885 },
      { lat: 35.4548, lng: -85.5855 },
      { lat: 35.4530, lng: -85.5820 },
      { lat: 35.4545, lng: -85.5845 },
      { lat: 35.4560, lng: -85.5870 },
      { lat: 35.4575, lng: -85.5900 },
    ],
    elevationProfile: [1900, 1880, 1800, 1350, 1400, 1700, 1900],
    likelyTrees: ['Hemlock', 'Oak', 'Hickory', 'Beech', 'Tulip Poplar'],
    likelySpecies: [
      'sp-chicken-of-the-woods',
      'sp-chanterelle',
      'sp-lions-mane',
      'sp-reishi',
      'sp-turkey-tail',
    ],
    images: ['/images/routes/route-savage-gulf-day-loop.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Fall Creek Falls Waterfall Circuit ---
  {
    id: 'route-fall-creek-waterfall-circuit',
    parkId: 'park-fall-creek-falls',
    name: 'Fall Creek Falls Waterfall Circuit',
    distance: 6.5,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.6660, lng: -85.3530 },
      { lat: 35.6645, lng: -85.3513 },
      { lat: 35.6625, lng: -85.3470 },
      { lat: 35.6610, lng: -85.3440 },
      { lat: 35.6628, lng: -85.3460 },
      { lat: 35.6650, lng: -85.3510 },
      { lat: 35.6660, lng: -85.3530 },
    ],
    elevationProfile: [1720, 1700, 1650, 1600, 1690, 1710, 1720],
    likelyTrees: ['Hemlock', 'Oak', 'Tulip Poplar', 'Beech', 'Maple'],
    likelySpecies: [
      'sp-chanterelle',
      'sp-chicken-of-the-woods',
      'sp-hen-of-the-woods',
      'sp-lions-mane',
    ],
    images: ['/images/routes/route-fall-creek-waterfall-circuit.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- South Cumberland Fiery Gizzard Connector ---
  {
    id: 'route-south-cumberland-gizzard-connector',
    parkId: 'park-south-cumberland',
    name: 'Fiery Gizzard to Grundy Forest Connector',
    distance: 14.2,
    difficulty: 'expert',
    coordinates: [
      { lat: 35.2406, lng: -85.8900 },
      { lat: 35.2380, lng: -85.8870 },
      { lat: 35.2330, lng: -85.8810 },
      { lat: 35.2305, lng: -85.8780 },
      { lat: 35.2280, lng: -85.8750 },
      { lat: 35.2260, lng: -85.8720 },
    ],
    elevationProfile: [1900, 1650, 1600, 1850, 1700, 1550],
    likelyTrees: ['Oak', 'Hemlock', 'Pine', 'Hickory', 'Beech', 'Birch'],
    likelySpecies: [
      'sp-chanterelle',
      'sp-chicken-of-the-woods',
      'sp-reishi',
      'sp-lions-mane',
      'sp-hen-of-the-woods',
    ],
    images: ['/images/routes/route-south-cumberland-gizzard-connector.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Cades Cove Nature Loop ---
  {
    id: 'route-cades-cove-nature-loop',
    parkId: 'park-cades-cove',
    name: 'Cades Cove Nature Loop',
    distance: 7.8,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.5960, lng: -83.7910 },
      { lat: 35.5945, lng: -83.7890 },
      { lat: 35.5920, lng: -83.7860 },
      { lat: 35.5900, lng: -83.7840 },
      { lat: 35.5920, lng: -83.7870 },
      { lat: 35.5940, lng: -83.7895 },
      { lat: 35.5960, lng: -83.7910 },
    ],
    elevationProfile: [1700, 1650, 1580, 1500, 1550, 1630, 1700],
    likelyTrees: ['Oak', 'Hemlock', 'Tulip Poplar', 'Rhododendron', 'Maple'],
    likelySpecies: [
      'sp-chanterelle',
      'sp-hen-of-the-woods',
      'sp-turkey-tail',
      'sp-chicken-of-the-woods',
    ],
    images: ['/images/routes/route-cades-cove-nature-loop.jpg'],
    lastUpdated: '2025-01-15',
  },
];
