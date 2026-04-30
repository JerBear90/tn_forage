/**
 * ForageFlow — Challenges Seed Data
 *
 * Initial challenge data covering three categories:
 *   - foraging: Tennessee-specific foraging challenges
 *   - seasonal: Seasonal activity challenges tied to TN seasons
 *   - park-exploration: Tennessee state park exploration challenges
 *
 * Each challenge starts with zero progress (all criteria completed: false,
 * no completedAt) per Requirement 2.6.
 *
 * Challenges are relevant to Tennessee foraging, seasonal activities,
 * and park exploration.
 */

import type { Challenge } from '@/types';

const TODAY = new Date().toISOString().split('T')[0];

export const challengesSeed: Challenge[] = [
  // ===========================================================================
  // FORAGING CHALLENGES
  // ===========================================================================
  {
    id: 'challenge-forage-mushroom-basics',
    title: 'Mushroom Foraging Fundamentals',
    description:
      'Learn the basics of mushroom identification in Tennessee by finding and documenting common edible species with expert confirmation.',
    category: 'foraging',
    criteria: [
      {
        id: 'crit-forage-mushroom-1',
        label: 'Identify a Chicken of the Woods in the field',
        completed: false,
      },
      {
        id: 'crit-forage-mushroom-2',
        label: 'Document a Chanterelle sighting with a photo',
        completed: false,
      },
      {
        id: 'crit-forage-mushroom-3',
        label: 'Record a Morel location during spring season',
        completed: false,
      },
      {
        id: 'crit-forage-mushroom-4',
        label: 'Complete a spore print for any wild mushroom',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
  {
    id: 'challenge-forage-edible-plants',
    title: 'Tennessee Wild Edible Plants',
    description:
      'Discover wild edible plants native to Tennessee. Always verify with a qualified expert before consuming any wild species.',
    category: 'foraging',
    criteria: [
      {
        id: 'crit-forage-plant-1',
        label: 'Identify wild ramps (Allium tricoccum) in East TN',
        completed: false,
      },
      {
        id: 'crit-forage-plant-2',
        label: 'Document pawpaw fruit on a foraging trip',
        completed: false,
      },
      {
        id: 'crit-forage-plant-3',
        label: 'Find and photograph wild blackberries along a trail',
        completed: false,
      },
      {
        id: 'crit-forage-plant-4',
        label: 'Log a sighting of wild ginger (Asarum canadense)',
        completed: false,
      },
      {
        id: 'crit-forage-plant-5',
        label: 'Identify chickweed (Stellaria media) in a field',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
  {
    id: 'challenge-forage-tree-id',
    title: 'Know Your Tennessee Trees',
    description:
      'Build your tree identification skills by recognizing the most common native trees in Tennessee forests.',
    category: 'foraging',
    criteria: [
      {
        id: 'crit-forage-tree-1',
        label: 'Identify an Eastern White Oak by its bark and leaves',
        completed: false,
      },
      {
        id: 'crit-forage-tree-2',
        label: 'Find a Shagbark Hickory and note its shaggy bark',
        completed: false,
      },
      {
        id: 'crit-forage-tree-3',
        label: 'Document a Tulip Poplar — Tennessee state tree',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },

  // ===========================================================================
  // SEASONAL CHALLENGES
  // ===========================================================================
  {
    id: 'challenge-seasonal-spring',
    title: 'Spring Awakening',
    description:
      'Celebrate the Tennessee spring season by finding early-season species that emerge as temperatures rise.',
    category: 'seasonal',
    criteria: [
      {
        id: 'crit-seasonal-spring-1',
        label: 'Find morels during the spring mushroom season',
        completed: false,
      },
      {
        id: 'crit-seasonal-spring-2',
        label: 'Document spring wildflowers on a trail hike',
        completed: false,
      },
      {
        id: 'crit-seasonal-spring-3',
        label: 'Log a trip to a park during peak spring bloom',
        completed: false,
      },
      {
        id: 'crit-seasonal-spring-4',
        label: 'Photograph redbud or dogwood trees in bloom',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
  {
    id: 'challenge-seasonal-summer',
    title: 'Summer Forager',
    description:
      'Take advantage of the warm Tennessee summer to explore trails and find species that thrive in heat and humidity.',
    category: 'seasonal',
    criteria: [
      {
        id: 'crit-seasonal-summer-1',
        label: 'Identify Chicken of the Woods on a summer hike',
        completed: false,
      },
      {
        id: 'crit-seasonal-summer-2',
        label: 'Document wild berries ripening along a trail',
        completed: false,
      },
      {
        id: 'crit-seasonal-summer-3',
        label: 'Complete a foraging trip in temperatures above 85°F',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
  {
    id: 'challenge-seasonal-fall',
    title: 'Autumn Harvest',
    description:
      'Fall is prime foraging season in Tennessee. Explore the forests as leaves change and fungi flourish.',
    category: 'seasonal',
    criteria: [
      {
        id: 'crit-seasonal-fall-1',
        label: 'Find Hen of the Woods (Maitake) at the base of an oak',
        completed: false,
      },
      {
        id: 'crit-seasonal-fall-2',
        label: 'Document fall foliage on a state park trail',
        completed: false,
      },
      {
        id: 'crit-seasonal-fall-3',
        label: 'Identify persimmon fruit on a native tree',
        completed: false,
      },
      {
        id: 'crit-seasonal-fall-4',
        label: 'Log a foraging trip during peak fall color season',
        completed: false,
      },
      {
        id: 'crit-seasonal-fall-5',
        label: 'Photograph oyster mushrooms on a dead hardwood',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },

  // ===========================================================================
  // PARK EXPLORATION CHALLENGES
  // ===========================================================================
  {
    id: 'challenge-park-great-smokies',
    title: 'Smoky Mountain Explorer',
    description:
      'Explore the parks and trails near the Great Smoky Mountains in East Tennessee — one of the most biodiverse regions in North America.',
    category: 'park-exploration',
    criteria: [
      {
        id: 'crit-park-smokies-1',
        label: 'Visit Cades Cove area and log a trip',
        completed: false,
      },
      {
        id: 'crit-park-smokies-2',
        label: 'Hike a trail at Frozen Head State Park',
        completed: false,
      },
      {
        id: 'crit-park-smokies-3',
        label: 'Document wildlife or species at Big Ridge State Park',
        completed: false,
      },
      {
        id: 'crit-park-smokies-4',
        label: 'Explore Panther Creek State Park trails',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
  {
    id: 'challenge-park-middle-tn',
    title: 'Middle Tennessee Trail Trekker',
    description:
      'Discover the rolling hills and cedar glades of Middle Tennessee by visiting its diverse state parks.',
    category: 'park-exploration',
    criteria: [
      {
        id: 'crit-park-middle-1',
        label: 'Hike the trails at Radnor Lake State Park',
        completed: false,
      },
      {
        id: 'crit-park-middle-2',
        label: 'Visit Long Hunter State Park and log a trip',
        completed: false,
      },
      {
        id: 'crit-park-middle-3',
        label: 'Explore Cedars of Lebanon State Park cedar glades',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
  {
    id: 'challenge-park-west-tn',
    title: 'West Tennessee Wetlands & Woods',
    description:
      'Venture into the bottomland forests and wetlands of West Tennessee to discover unique habitats and species.',
    category: 'park-exploration',
    criteria: [
      {
        id: 'crit-park-west-1',
        label: 'Visit Reelfoot Lake State Park and observe cypress trees',
        completed: false,
      },
      {
        id: 'crit-park-west-2',
        label: 'Hike at Meeman-Shelby Forest State Park',
        completed: false,
      },
      {
        id: 'crit-park-west-3',
        label: 'Log a foraging trip at Natchez Trace State Park',
        completed: false,
      },
      {
        id: 'crit-park-west-4',
        label: 'Document bottomland hardwood species in West TN',
        completed: false,
      },
    ],
    lastUpdated: TODAY,
  },
];
