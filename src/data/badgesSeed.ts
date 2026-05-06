/**
 * ForageWise — Badge Seed Data
 *
 * Defines all challenge badges that can be earned by completing challenges
 * or achieving specific milestones. Each challenge-linked badge maps to an
 * existing challenge ID from challengesSeed.ts.
 *
 * Bonus badges are earned through other activities (ID wizard, trips, sharing).
 */

import type { ChallengeBadge } from '@/types';

export const badgesSeed: ChallengeBadge[] = [
  // ===========================================================================
  // CHALLENGE-LINKED BADGES
  // ===========================================================================
  {
    id: 'badge-mushroom-explorer',
    challengeId: 'challenge-forage-mushroom-basics',
    title: '🍄 Mushroom Explorer',
    description:
      'Earned by completing the Mushroom Foraging Fundamentals challenge — identifying and documenting wild mushrooms in Tennessee.',
    icon: '🍄',
    isEarned: false,
  },
  {
    id: 'badge-plant-discoverer',
    challengeId: 'challenge-forage-edible-plants',
    title: '🌿 Plant Discoverer',
    description:
      'Earned by completing the Tennessee Wild Edible Plants challenge — discovering native edible plants across the state.',
    icon: '🌿',
    isEarned: false,
  },
  {
    id: 'badge-spring-forager',
    challengeId: 'challenge-seasonal-spring',
    title: '🌸 Spring Forager',
    description:
      'Earned by completing the Spring Awakening challenge — finding early-season species as Tennessee warms up.',
    icon: '🌸',
    isEarned: false,
  },
  {
    id: 'badge-fall-harvester',
    challengeId: 'challenge-seasonal-fall',
    title: '🍂 Fall Harvester',
    description:
      'Earned by completing the Autumn Harvest challenge — exploring forests during peak fall foraging season.',
    icon: '🍂',
    isEarned: false,
  },
  {
    id: 'badge-east-tn-explorer',
    challengeId: 'challenge-park-great-smokies',
    title: '⛰️ East TN Explorer',
    description:
      'Earned by completing the Smoky Mountain Explorer challenge — visiting parks near the Great Smoky Mountains.',
    icon: '⛰️',
    isEarned: false,
  },
  {
    id: 'badge-middle-tn-explorer',
    challengeId: 'challenge-park-middle-tn',
    title: '🏞️ Middle TN Explorer',
    description:
      'Earned by completing the Middle Tennessee Trail Trekker challenge — discovering rolling hills and cedar glades.',
    icon: '🏞️',
    isEarned: false,
  },
  {
    id: 'badge-west-tn-explorer',
    challengeId: 'challenge-park-west-tn',
    title: '🌅 West TN Explorer',
    description:
      'Earned by completing the West Tennessee Wetlands & Woods challenge — exploring bottomland forests and wetlands.',
    icon: '🌅',
    isEarned: false,
  },

  // ===========================================================================
  // BONUS BADGES
  // ===========================================================================
  {
    id: 'badge-first-id',
    challengeId: '',
    title: '🔍 First Identification',
    description:
      'Earned by completing your first species identification using the ID wizard.',
    icon: '🔍',
    isEarned: false,
  },
  {
    id: 'badge-5-trips',
    challengeId: '',
    title: '🗺️ Trail Blazer',
    description:
      'Earned by planning and completing 5 foraging trips across Tennessee.',
    icon: '🗺️',
    isEarned: false,
  },
  {
    id: 'badge-community-contributor',
    challengeId: '',
    title: '👥 Community Contributor',
    description:
      'Earned by sharing 3 or more sightings with the ForageWise community.',
    icon: '👥',
    isEarned: false,
  },
];
