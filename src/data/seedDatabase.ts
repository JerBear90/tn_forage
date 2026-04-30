/**
 * ForageFlow — Database Seeding
 *
 * Loads local seed data (species, plants, trees) into IndexedDB on first run.
 * Checks if data already exists before seeding to avoid duplicating records.
 */

import { getDB, countRecords } from '@/offline/db';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';
import { treesSeed } from '@/data/treesSeed';
import { parksSeed } from '@/data/parksSeed';
import { trailsSeed } from '@/data/trailsSeed';
import { routesSeed } from '@/data/routesSeed';
import { challengesSeed } from '@/data/challengesSeed';

/**
 * Seed the IndexedDB database with local species, plant, tree, park, trail, and route data.
 *
 * This function is idempotent — it only seeds a store if it is currently empty.
 * Call this on app startup (e.g., in a layout effect or initialization hook).
 *
 * @returns An object indicating which stores were seeded and how many records were added.
 */
export async function seedDatabase(): Promise<{
  speciesSeeded: number;
  plantsSeeded: number;
  treesSeeded: number;
  parksSeeded: number;
  trailsSeeded: number;
  routesSeeded: number;
  challengesSeeded: number;
}> {
  const db = await getDB();

  let speciesSeeded = 0;
  let plantsSeeded = 0;
  let treesSeeded = 0;
  let parksSeeded = 0;
  let trailsSeeded = 0;
  let routesSeeded = 0;
  let challengesSeeded = 0;

  // --- Seed species (mushrooms) ---
  const speciesCount = await countRecords('species');
  if (speciesCount === 0) {
    const tx = db.transaction('species', 'readwrite');
    for (const species of speciesSeed) {
      await tx.store.put(species);
    }
    await tx.done;
    speciesSeeded = speciesSeed.length;
  }

  // --- Seed plants ---
  const plantsCount = await countRecords('plants');
  if (plantsCount === 0) {
    const tx = db.transaction('plants', 'readwrite');
    for (const plant of plantsSeed) {
      await tx.store.put(plant);
    }
    await tx.done;
    plantsSeeded = plantsSeed.length;
  }

  // --- Seed trees ---
  const treesCount = await countRecords('trees');
  if (treesCount === 0) {
    const tx = db.transaction('trees', 'readwrite');
    for (const tree of treesSeed) {
      await tx.store.put(tree);
    }
    await tx.done;
    treesSeeded = treesSeed.length;
  }

  // --- Seed parks ---
  const parksCount = await countRecords('parks');
  if (parksCount === 0) {
    const tx = db.transaction('parks', 'readwrite');
    for (const park of parksSeed) {
      await tx.store.put(park);
    }
    await tx.done;
    parksSeeded = parksSeed.length;
  }

  // --- Seed trails ---
  const trailsCount = await countRecords('trails');
  if (trailsCount === 0) {
    const tx = db.transaction('trails', 'readwrite');
    for (const trail of trailsSeed) {
      await tx.store.put(trail);
    }
    await tx.done;
    trailsSeeded = trailsSeed.length;
  }

  // --- Seed routes ---
  const routesCount = await countRecords('routes');
  if (routesCount === 0) {
    const tx = db.transaction('routes', 'readwrite');
    for (const route of routesSeed) {
      await tx.store.put(route);
    }
    await tx.done;
    routesSeeded = routesSeed.length;
  }

  // --- Seed challenges ---
  const challengesCount = await countRecords('challenges');
  if (challengesCount === 0) {
    const tx = db.transaction('challenges', 'readwrite');
    for (const challenge of challengesSeed) {
      await tx.store.put(challenge);
    }
    await tx.done;
    challengesSeeded = challengesSeed.length;
  }

  return { speciesSeeded, plantsSeeded, treesSeeded, parksSeeded, trailsSeeded, routesSeeded, challengesSeeded };
}
