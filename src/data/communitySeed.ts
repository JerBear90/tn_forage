/**
 * ForageWise — Community Seed Data
 *
 * Sample community sightings for testing and demo purposes.
 * These appear in the community feed so new users see activity.
 */

import type { CommunityDraft } from '@/types';

export const communitySeed: CommunityDraft[] = [
  {
    id: 'seed-sighting-1',
    userId: 'demo-user-sarah',
    speciesGuess: 'Chanterelle',
    photos: [],
    coordinates: { lat: 35.6645, lng: -85.3925 },
    notes: 'Found a nice patch of golden chanterelles near the creek at Fall Creek Falls. Growing in moss under oaks. About 2 dozen fruiting bodies.',
    visibility: 'public',
    createdAt: '2026-04-28T14:30:00.000Z',
    updatedAt: '2026-04-28T14:30:00.000Z',
  },
  {
    id: 'seed-sighting-2',
    userId: 'demo-user-mike',
    speciesGuess: 'Chicken of the Woods',
    photos: [],
    coordinates: { lat: 36.3231, lng: -83.9981 },
    notes: 'Massive shelf of chicken of the woods on a dead oak at Big Ridge. Bright orange and yellow, very fresh. Easily 5 lbs.',
    visibility: 'public',
    createdAt: '2026-04-25T10:15:00.000Z',
    updatedAt: '2026-04-25T10:15:00.000Z',
  },
  {
    id: 'seed-sighting-3',
    userId: 'demo-user-jen',
    speciesGuess: 'Morel',
    photos: [],
    coordinates: { lat: 35.9465, lng: -83.4395 },
    notes: 'First morels of the season! Found about a dozen yellows near dead elms along the trail. Soil was moist from last week\'s rain.',
    visibility: 'public',
    createdAt: '2026-04-20T09:45:00.000Z',
    updatedAt: '2026-04-20T09:45:00.000Z',
  },
  {
    id: 'seed-sighting-4',
    userId: 'demo-user-carlos',
    speciesGuess: 'Oyster Mushroom',
    photos: [],
    coordinates: { lat: 36.1627, lng: -86.7816 },
    notes: 'Cluster of oyster mushrooms on a fallen poplar near Radnor Lake. White caps, decurrent gills. Smells like anise.',
    visibility: 'public',
    createdAt: '2026-04-18T16:20:00.000Z',
    updatedAt: '2026-04-18T16:20:00.000Z',
  },
  {
    id: 'seed-sighting-5',
    userId: 'demo-user-sarah',
    speciesGuess: 'Reishi',
    photos: [],
    coordinates: { lat: 36.4200, lng: -84.5900 },
    notes: 'Beautiful reishi growing on a hemlock stump at Frozen Head. Lacquered red-brown cap, white growing edge. About 8 inches across.',
    visibility: 'public',
    createdAt: '2026-04-15T11:00:00.000Z',
    updatedAt: '2026-04-15T11:00:00.000Z',
  },
  {
    id: 'seed-sighting-6',
    userId: 'demo-user-mike',
    speciesGuess: 'Unknown — need ID help',
    photos: [],
    coordinates: { lat: 35.7796, lng: -83.5085 },
    notes: '[ID Request] Found this growing on a dead log near a creek. Small brown caps, about 2 inches wide. Gills are white. Growing in a cluster of about 10. Can anyone help identify?',
    visibility: 'public',
    createdAt: '2026-04-12T13:30:00.000Z',
    updatedAt: '2026-04-12T13:30:00.000Z',
  },
  {
    id: 'seed-sighting-7',
    userId: 'demo-user-jen',
    speciesGuess: 'Ramps (Wild Leek)',
    photos: [],
    coordinates: { lat: 35.6100, lng: -83.4800 },
    notes: 'Ramps are up! Found a healthy patch in a cove near the Smokies. Broad green leaves, red stems. Only took a few — leave plenty for the colony to recover.',
    visibility: 'public',
    createdAt: '2026-04-10T08:15:00.000Z',
    updatedAt: '2026-04-10T08:15:00.000Z',
  },
  {
    id: 'seed-sighting-8',
    userId: 'demo-user-carlos',
    speciesGuess: 'Lion\'s Mane',
    photos: [],
    coordinates: { lat: 36.5500, lng: -82.5600 },
    notes: 'Spotted a lion\'s mane high up on a beech tree at Warriors Path. About 6 feet up, size of a softball. White cascading spines. Beautiful specimen.',
    visibility: 'public',
    createdAt: '2026-04-08T15:45:00.000Z',
    updatedAt: '2026-04-08T15:45:00.000Z',
  },
];
