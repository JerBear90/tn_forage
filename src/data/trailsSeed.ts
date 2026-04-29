/**
 * ForageFlow — Tennessee Trails Seed Data
 *
 * Local seed data for trails within Tennessee State Parks.
 * This data is loaded into IndexedDB on first run.
 *
 * Each trail includes realistic coordinates for polyline rendering,
 * distance, difficulty, likely trees, and likely species.
 */

import type { Trail } from '@/types';

export const trailsSeed: Trail[] = [
  // --- Radnor Lake State Park ---
  {
    id: 'trail-radnor-lake-trail',
    parkId: 'park-radnor-lake',
    name: 'Lake Trail',
    distance: 1.35,
    difficulty: 'easy',
    coordinates: [
      { lat: 36.0631, lng: -86.8103 },
      { lat: 36.0625, lng: -86.8085 },
      { lat: 36.0618, lng: -86.8060 },
      { lat: 36.0622, lng: -86.8035 },
      { lat: 36.0630, lng: -86.8015 },
    ],
    elevationProfile: [800, 810, 805, 815, 808],
    likelyTrees: ['Oak', 'Hickory', 'Maple', 'Tulip Poplar'],
    likelySpecies: ['sp-chicken-of-the-woods', 'sp-chanterelle', 'sp-turkey-tail'],
    images: ['/images/trails/trail-radnor-lake-trail.jpg'],
    lastUpdated: '2025-01-15',
  },
  {
    id: 'trail-radnor-south-cove',
    parkId: 'park-radnor-lake',
    name: 'South Cove Trail',
    distance: 0.65,
    difficulty: 'easy',
    coordinates: [
      { lat: 36.0610, lng: -86.8110 },
      { lat: 36.0605, lng: -86.8095 },
      { lat: 36.0600, lng: -86.8075 },
      { lat: 36.0608, lng: -86.8060 },
    ],
    elevationProfile: [790, 795, 800, 798],
    likelyTrees: ['Oak', 'Beech', 'Maple'],
    likelySpecies: ['sp-chanterelle', 'sp-hen-of-the-woods'],
    images: ['/images/trails/trail-radnor-south-cove.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Fall Creek Falls State Park ---
  {
    id: 'trail-fall-creek-gorge-overlook',
    parkId: 'park-fall-creek-falls',
    name: 'Gorge Overlook Trail',
    distance: 2.0,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.6645, lng: -85.3513 },
      { lat: 35.6638, lng: -85.3490 },
      { lat: 35.6625, lng: -85.3470 },
      { lat: 35.6615, lng: -85.3455 },
      { lat: 35.6610, lng: -85.3440 },
    ],
    elevationProfile: [1700, 1680, 1650, 1620, 1600],
    likelyTrees: ['Hemlock', 'Oak', 'Tulip Poplar', 'Beech'],
    likelySpecies: ['sp-chicken-of-the-woods', 'sp-reishi', 'sp-turkey-tail'],
    images: ['/images/trails/trail-fall-creek-gorge-overlook.jpg'],
    lastUpdated: '2025-01-15',
  },
  {
    id: 'trail-fall-creek-woodland',
    parkId: 'park-fall-creek-falls',
    name: 'Woodland Trail',
    distance: 3.2,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.6660, lng: -85.3530 },
      { lat: 35.6650, lng: -85.3510 },
      { lat: 35.6640, lng: -85.3495 },
      { lat: 35.6632, lng: -85.3480 },
      { lat: 35.6628, lng: -85.3460 },
    ],
    elevationProfile: [1720, 1700, 1690, 1710, 1695],
    likelyTrees: ['Oak', 'Hickory', 'Maple', 'Pine'],
    likelySpecies: ['sp-chanterelle', 'sp-hen-of-the-woods', 'sp-lions-mane'],
    images: ['/images/trails/trail-fall-creek-woodland.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Frozen Head State Park ---
  {
    id: 'trail-frozen-head-panther-branch',
    parkId: 'park-frozen-head',
    name: 'Panther Branch Trail',
    distance: 5.8,
    difficulty: 'hard',
    coordinates: [
      { lat: 36.1200, lng: -84.4289 },
      { lat: 36.1215, lng: -84.4270 },
      { lat: 36.1230, lng: -84.4250 },
      { lat: 36.1248, lng: -84.4235 },
      { lat: 36.1260, lng: -84.4215 },
    ],
    elevationProfile: [1600, 1850, 2100, 2400, 2800],
    likelyTrees: ['Oak', 'Hemlock', 'Tulip Poplar', 'Birch'],
    likelySpecies: ['sp-chanterelle', 'sp-chicken-of-the-woods', 'sp-reishi'],
    images: ['/images/trails/trail-frozen-head-panther-branch.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Savage Gulf State Natural Area ---
  {
    id: 'trail-savage-gulf-stone-door',
    parkId: 'park-savage-gulf',
    name: 'Stone Door Trail',
    distance: 1.9,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.4575, lng: -85.5900 },
      { lat: 35.4565, lng: -85.5885 },
      { lat: 35.4555, lng: -85.5870 },
      { lat: 35.4548, lng: -85.5855 },
      { lat: 35.4540, lng: -85.5840 },
    ],
    elevationProfile: [1900, 1880, 1860, 1800, 1750],
    likelyTrees: ['Oak', 'Hickory', 'Hemlock', 'Pine'],
    likelySpecies: ['sp-turkey-tail', 'sp-reishi', 'sp-chanterelle'],
    images: ['/images/trails/trail-savage-gulf-stone-door.jpg'],
    lastUpdated: '2025-01-15',
  },
  {
    id: 'trail-savage-gulf-big-creek',
    parkId: 'park-savage-gulf',
    name: 'Big Creek Gulf Trail',
    distance: 8.5,
    difficulty: 'hard',
    coordinates: [
      { lat: 35.4590, lng: -85.5920 },
      { lat: 35.4575, lng: -85.5895 },
      { lat: 35.4560, lng: -85.5870 },
      { lat: 35.4545, lng: -85.5845 },
      { lat: 35.4530, lng: -85.5820 },
    ],
    elevationProfile: [1900, 1700, 1500, 1400, 1350],
    likelyTrees: ['Hemlock', 'Oak', 'Beech', 'Tulip Poplar'],
    likelySpecies: ['sp-chicken-of-the-woods', 'sp-lions-mane', 'sp-hen-of-the-woods'],
    images: ['/images/trails/trail-savage-gulf-big-creek.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- South Cumberland State Park ---
  {
    id: 'trail-south-cumberland-fiery-gizzard',
    parkId: 'park-south-cumberland',
    name: 'Fiery Gizzard Trail',
    distance: 12.5,
    difficulty: 'expert',
    coordinates: [
      { lat: 35.2406, lng: -85.8900 },
      { lat: 35.2380, lng: -85.8870 },
      { lat: 35.2355, lng: -85.8840 },
      { lat: 35.2330, lng: -85.8810 },
      { lat: 35.2305, lng: -85.8780 },
    ],
    elevationProfile: [1900, 1650, 1400, 1600, 1850],
    likelyTrees: ['Oak', 'Hemlock', 'Pine', 'Hickory', 'Beech'],
    likelySpecies: ['sp-chanterelle', 'sp-chicken-of-the-woods', 'sp-reishi', 'sp-lions-mane'],
    images: ['/images/trails/trail-south-cumberland-fiery-gizzard.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Cades Cove — Great Smoky Mountains ---
  {
    id: 'trail-cades-cove-abrams-falls',
    parkId: 'park-cades-cove',
    name: 'Abrams Falls Trail',
    distance: 5.0,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.5960, lng: -83.7910 },
      { lat: 35.5945, lng: -83.7890 },
      { lat: 35.5930, lng: -83.7870 },
      { lat: 35.5915, lng: -83.7855 },
      { lat: 35.5900, lng: -83.7840 },
    ],
    elevationProfile: [1700, 1650, 1600, 1550, 1500],
    likelyTrees: ['Oak', 'Hemlock', 'Tulip Poplar', 'Rhododendron'],
    likelySpecies: ['sp-chanterelle', 'sp-hen-of-the-woods', 'sp-turkey-tail'],
    images: ['/images/trails/trail-cades-cove-abrams-falls.jpg'],
    lastUpdated: '2025-01-15',
  },

  // --- Roan Mountain State Park ---
  {
    id: 'trail-roan-mountain-cloudland',
    parkId: 'park-roan-mountain',
    name: 'Cloudland Trail',
    distance: 1.2,
    difficulty: 'moderate',
    coordinates: [
      { lat: 36.1614, lng: -82.1035 },
      { lat: 36.1625, lng: -82.1020 },
      { lat: 36.1638, lng: -82.1005 },
      { lat: 36.1650, lng: -82.0990 },
    ],
    elevationProfile: [5800, 5950, 6100, 6285],
    likelyTrees: ['Spruce', 'Fir', 'Birch', 'Beech'],
    likelySpecies: ['sp-chanterelle', 'sp-turkey-tail'],
    images: ['/images/trails/trail-roan-mountain-cloudland.jpg'],
    lastUpdated: '2025-01-15',
  },
];
