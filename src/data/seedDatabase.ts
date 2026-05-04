/**
 * ForageFlow — Database Seeding
 *
 * Loads local seed data (species, plants, trees) into IndexedDB on first run.
 * Uses a seed data version to detect when seed data has been updated and
 * re-seeds the reference stores (species, plants, trees) accordingly.
 * User-generated data (trips, logs, etc.) is never overwritten.
 */

import { getDB, countRecords, clearStore, getRecord, putRecord } from '@/offline/db';
import { speciesSeed } from '@/data/speciesSeed';
import { plantsSeed } from '@/data/plantsSeed';
import { treesSeed } from '@/data/treesSeed';
import { parksSeed } from '@/data/parksSeed';
import { trailsSeed } from '@/data/trailsSeed';
import { routesSeed } from '@/data/routesSeed';
import { challengesSeed } from '@/data/challengesSeed';
import { blogSeed } from '@/data/blogSeed';
import { tourSeed } from '@/data/tourSeed';
import { featureFlagsSeed } from '@/data/featureFlagsSeed';

/**
 * Bump this version whenever seed data changes (new images, new entries, etc.).
 * This triggers a re-seed of reference stores on next app load.
 */
const SEED_DATA_VERSION = 8;

/**
 * Seed the IndexedDB database with local species, plant, tree, park, trail, and route data.
 *
 * Reference stores (species, plants, trees, parks, trails, routes, challenges)
 * are re-seeded when the seed data version changes. User-generated data is
 * never touched.
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
  blogArticlesSeeded: number;
  guidedToursSeeded: number;
  featureFlagsSeeded: number;
}> {
  const db = await getDB();

  let speciesSeeded = 0;
  let plantsSeeded = 0;
  let treesSeeded = 0;
  let parksSeeded = 0;
  let trailsSeeded = 0;
  let routesSeeded = 0;
  let challengesSeeded = 0;
  let blogArticlesSeeded = 0;
  let guidedToursSeeded = 0;
  let featureFlagsSeeded = 0;

  // Check if seed data version has changed
  const storedSettings = await getRecord('settings', 'seedDataVersion');
  const currentVersion = (storedSettings as { id: string; value: number } | undefined)?.value ?? 0;
  const needsReseed = currentVersion < SEED_DATA_VERSION;

  // --- Seed species (mushrooms) ---
  const speciesCount = await countRecords('species');
  if (speciesCount === 0 || needsReseed) {
    if (speciesCount > 0) await clearStore('species');
    const tx = db.transaction('species', 'readwrite');
    for (const species of speciesSeed) {
      await tx.store.put(species);
    }
    await tx.done;
    speciesSeeded = speciesSeed.length;
  }

  // --- Seed plants ---
  const plantsCount = await countRecords('plants');
  if (plantsCount === 0 || needsReseed) {
    if (plantsCount > 0) await clearStore('plants');
    const tx = db.transaction('plants', 'readwrite');
    for (const plant of plantsSeed) {
      await tx.store.put(plant);
    }
    await tx.done;
    plantsSeeded = plantsSeed.length;
  }

  // --- Seed trees ---
  const treesCount = await countRecords('trees');
  if (treesCount === 0 || needsReseed) {
    if (treesCount > 0) await clearStore('trees');
    const tx = db.transaction('trees', 'readwrite');
    for (const tree of treesSeed) {
      await tx.store.put(tree);
    }
    await tx.done;
    treesSeeded = treesSeed.length;
  }

  // --- Seed parks ---
  const parksCount = await countRecords('parks');
  if (parksCount === 0 || needsReseed) {
    if (parksCount > 0) await clearStore('parks');
    const tx = db.transaction('parks', 'readwrite');
    for (const park of parksSeed) {
      await tx.store.put(park);
    }
    await tx.done;
    parksSeeded = parksSeed.length;
  }

  // --- Seed trails ---
  const trailsCount = await countRecords('trails');
  if (trailsCount === 0 || needsReseed) {
    if (trailsCount > 0) await clearStore('trails');
    const tx = db.transaction('trails', 'readwrite');
    for (const trail of trailsSeed) {
      await tx.store.put(trail);
    }
    await tx.done;
    trailsSeeded = trailsSeed.length;
  }

  // --- Seed routes ---
  const routesCount = await countRecords('routes');
  if (routesCount === 0 || needsReseed) {
    if (routesCount > 0) await clearStore('routes');
    const tx = db.transaction('routes', 'readwrite');
    for (const route of routesSeed) {
      await tx.store.put(route);
    }
    await tx.done;
    routesSeeded = routesSeed.length;
  }

  // --- Seed challenges ---
  const challengesCount = await countRecords('challenges');
  if (challengesCount === 0 || needsReseed) {
    if (challengesCount > 0) await clearStore('challenges');
    const tx = db.transaction('challenges', 'readwrite');
    for (const challenge of challengesSeed) {
      await tx.store.put(challenge);
    }
    await tx.done;
    challengesSeeded = challengesSeed.length;
  }

  // --- Seed blog articles ---
  const blogCount = await countRecords('blogArticles');
  if (blogCount === 0 || needsReseed) {
    if (blogCount > 0) await clearStore('blogArticles');
    const tx = db.transaction('blogArticles', 'readwrite');
    for (const article of blogSeed) {
      await tx.store.put(article);
    }
    await tx.done;
    blogArticlesSeeded = blogSeed.length;
  }

  // --- Seed guided tours ---
  const toursCount = await countRecords('guidedTours');
  if (toursCount === 0 || needsReseed) {
    if (toursCount > 0) await clearStore('guidedTours');
    const tx = db.transaction('guidedTours', 'readwrite');
    for (const tour of tourSeed) {
      await tx.store.put(tour);
    }
    await tx.done;
    guidedToursSeeded = tourSeed.length;
  }

  // --- Seed feature flags ---
  const flagsCount = await countRecords('featureFlags');
  if (flagsCount === 0 || needsReseed) {
    if (flagsCount > 0) await clearStore('featureFlags');
    const tx = db.transaction('featureFlags', 'readwrite');
    for (const flag of featureFlagsSeed) {
      await tx.store.put(flag);
    }
    await tx.done;
    featureFlagsSeeded = featureFlagsSeed.length;
  }

  // --- Update seed data version ---
  if (needsReseed) {
    await putRecord('settings', { id: 'seedDataVersion', value: SEED_DATA_VERSION } as never);
  }

  return {
    speciesSeeded,
    plantsSeeded,
    treesSeeded,
    parksSeeded,
    trailsSeeded,
    routesSeeded,
    challengesSeeded,
    blogArticlesSeeded,
    guidedToursSeeded,
    featureFlagsSeeded,
  };
}
